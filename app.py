
import os
import uuid 
import time
import openai
import ast
import re
import logging

from io import BytesIO
from dotenv import load_dotenv
from urllib.parse import urlparse
from pydantic import BaseModel, Field
from PyPDF2 import PdfReader
from docx import Document as DocxDocument
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from flask_cors import CORS
import pandas as pd
import requests 
import io
from tempfile import NamedTemporaryFile
import subprocess
import docx2txt2
import xlrd
import json
from flask import Flask, request,jsonify,send_file
from typing import Union
from langchain.agents import Tool
from langchain.schema import Document
from langchain_openai import AzureChatOpenAI
from langchain_openai import AzureOpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_community.callbacks import get_openai_callback
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from langchain_community.vectorstores import FAISS
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_text_splitters import MarkdownHeaderTextSplitter
from pptx import Presentation

from azure.storage.blob import BlobServiceClient

from utilities.Document_Processing import BlobStorageProcessor
from utilities.Document_Processing import DocumentIntelligenceLoader
from utilities.ABB_entity_extraction import extract_entities_from_blob
from utilities.Excel_Formatting import create_excel_with_formatting_local
from utilities.file_processor import process_file
from utilities.clauses import clauses

app = Flask(__name__,template_folder='template',static_folder='./frontend/build',static_url_path='/')
app.json.sort_keys = False
CORS(app)


load_dotenv()

# Configuration for Azure OpenAI
openai.api_type =os.environ.get("AZURE_OPENAI_TYPE")
openai.api_base =os.environ.get('AZURE_OPENAI_ENDPOINT')  
openai.api_key = os.environ.get('AZURE_OPENAI_API_KEY')
openai.api_version = os.environ.get('AZURE_OPENAI_API_VERSION')

LLM_MODEL=os.environ.get('AZURE_OPENAI_GPT4_DEPLOYMENT_NAME')
AZURE_BLOB_STORAGE_CONTAINER_NAME = os.environ.get('AZURE_BLOB_STORAGE_CONTAINER_NAME')  # Replace with your Azure Blob Storage container name
AZURE_BLOB_STORAGE_ACCOUNT_NAME = os.environ.get('AZURE_BLOB_STORAGE_ACCOUNT_NAME')  # Replace with your Azure Storage account name
AZURE_BLOB_STORAGE_ACCOUNT_KEY =  os.environ.get('AZURE_BLOB_STORAGE_ACCOUNT_KEY')  # Replace with your Azure Storage account key
AZURE_BLOB_STORAGE_CONTAINER_URL = os.environ.get('AZURE_BLOB_STORAGE_CONTAINER_URL')
AZURE_VECTOR_STORAGE_CONTAINER_NAME= os.environ.get('AZURE_VECTOR_STORAGE_CONTAINER_NAME')
AZURE_BLOB_STORAGE_CONNECTION_STRING=os.environ.get('AZURE_BLOB_STORAGE_CONNECTION_STRING')
AZURE_PRELOADED_CONTAINER_NAME=os.environ.get('AZURE_PRELOADED_CONTAINER_NAME')
AZURE_DOWNLOAD_STORAGE_CONTAINER_NAME=os.environ.get('AZURE_DOWNLOAD_STORAGE_CONTAINER_NAME')

AZURE_STORAGE_CONNECTION_STRING_DOWNLOAD_EXCEL=os.environ.get('AZURE_STORAGE_CONNECTION_STRING_DOWNLOAD_EXCEL')
AZURE_DOWNLOAD_EXCEL_STORAGE_CONTAINER_NAME=os.environ.get('AZURE_DOWNLOAD_EXCEL_STORAGE_CONTAINER_NAME')

AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME=os.environ.get('AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME')
AZURE_MODEL=os.environ.get('AZURE_OPENAI_MODEL')


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize necessary variables here (e.g., llm, retriever, prompt_template)
llm = AzureChatOpenAI(azure_deployment=LLM_MODEL, 
                      openai_api_key=openai.api_key, 
                      openai_api_version=openai.api_version, 
                      azure_endpoint=openai.api_base)

blobstorageprocessor=BlobStorageProcessor()
documentintelligence=DocumentIntelligenceLoader()
embeddings = AzureOpenAIEmbeddings(azure_endpoint=openai.api_base,api_key=openai.api_key,
            azure_deployment=AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME,
            openai_api_version=openai.api_version,
            )

def Information(BaseModel):
        Entity: str = Field(title="Summary", description="Extract the relevant information from the document. If not explicitly provided do not guess.")

class DocumentInput(BaseModel):
    question: str = Field()


# Helper functions
def id_generator():
    return str(uuid.uuid4())

@app.route('/')
def index():
    logger.info('Index route accessed.')
    return app.send_static_file('index.html')

blob_service_client = BlobServiceClient.from_connection_string(AZURE_BLOB_STORAGE_CONNECTION_STRING)
blob_list=[]


@app.route('/upload_IS_GTC', methods=['POST'])
def upload_files():
    try:
        # Check if the request contains 'index_name' as a boolean indicator
        index_name = request.form.get('index_name') is not None
        supplier_gtc = request.files.get('supplier_gtc')
        abb_gtc = request.files.get('abb_gtc') if not index_name else None

        if not supplier_gtc:
            logger.error('Supplier GTC file must be uploaded.')
            return jsonify({'error': 'Supplier GTC file must be uploaded'}), 400

        if index_name:
            if abb_gtc:
                logger.error('Cannot upload ABB GTC file when index_name is selected.')
                return jsonify({'error': 'Cannot upload ABB GTC file when index_name is selected'}), 400
            files = [supplier_gtc]
            file_names = ['supplier_gtc']
        else:
            if not abb_gtc:
                logger.error('ABB GTC file must be uploaded if index_name is not provided.')
                return jsonify({'error': 'ABB GTC file must be uploaded if index_name is not provided'}), 400
            files = [abb_gtc, supplier_gtc]
            file_names = ['abb_gtc', 'supplier_gtc']

        if any(file.filename == '' for file in files):
            logger.error('One or both files are missing filenames.')
            return jsonify({'error': 'One or both files are missing filenames'}), 400

        global blob_list
        timestamp = datetime.now().strftime("%Y%m%d%H%M")
        folder_name = f"rfq_{timestamp}_{str(uuid.uuid4())}"

        file_info = []

        for file, name in zip(files, file_names):
            blob_name = f"{folder_name}/{file.filename}"
            blob_list.append(blob_name)
            logger.info(f'Blob Name {blob_name}')
            blobstorageprocessor.upload_blob(AZURE_BLOB_STORAGE_CONTAINER_NAME, blob_name, file)
            logger.info(f'File "{file.filename}" uploaded successfully.')

            file_url = f'{AZURE_BLOB_STORAGE_CONTAINER_URL}/{blob_name}'
            file_info.append({
                'name': name,
                'original_filename': file.filename,
                'blob_name': blob_name,
                'file_url': file_url,
                'folder_name': folder_name
            })

        return jsonify({
            'success': 'Files uploaded successfully',
            'files': file_info
        }), 200

    except Exception as e:
        logger.error(f'Error in upload_files route: {str(e)}')
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

def parse_blob_url(blob_url):
    parsed_url = urlparse(blob_url)
    path_parts = parsed_url.path.lstrip('/').split('/')
    container_name = path_parts[0]
    blob_name = '/'.join(path_parts[1:])
    return container_name, blob_name

# Helper to safely join sequences of mixed types into a string
def safe_join(seq, sep="\n"):
    safe = []
    for elt in seq:
        if isinstance(elt, str):
            safe.append(elt)
        elif isinstance(elt, dict):
            text = elt.get("text") or elt.get("difference") or json.dumps(elt)
            safe.append(text)
        else:
            safe.append(str(elt))
    return sep.join(safe)

# Parse and normalize full JSON responses into dicts of lists of strings
def convert_to_dict(text: str) -> dict:
    start = text.index("{")
    end = text.rfind("}") + 1
    try:
        data = ast.literal_eval(text[start:end])
    except Exception as e:
        return {"error": f"Error parsing LLM response: {e}"}
    # Ensure each section is a list of strings
    for section in ("similarities", "additions", "removals", "differences"):
        items = data.get(section, [])
        flat = []
        for item in items:
            if isinstance(item, str):
                flat.append(item)
            elif isinstance(item, dict):
                txt = item.get("text") or json.dumps(item)
                flat.append(txt)
            else:
                flat.append(str(item))
        data[section] = flat
    return data

# Parse the single-field additions JSON into a dict
def string_to_dict(answer: str) -> dict:
    try:
        cleaned = answer.strip().strip("```")
        raw = json.loads(cleaned)
    except Exception:
        raw = []
    # Unwrap if dict with 'additions'
    actual = raw.get("additions") if isinstance(raw, dict) and "additions" in raw else raw
    if not isinstance(actual, list):
        actual = [actual]
    # Normalize to list of strings
    flat = []
    for elt in actual:
        if isinstance(elt, str):
            flat.append(elt)
        elif isinstance(elt, dict):
            txt = elt.get("text") or json.dumps(elt)
            flat.append(txt)
        else:
            flat.append(str(elt))
    return {"additions": flat}

# Retries helper unchanged
def process_entity_with_retries(entity, agent_additions, agent_others, tools, max_retries=1, backoff_factor=0.5):
    retries = 0
    while retries <= max_retries:
        try:
            if entity == "ADDITIONS IN SUPPLIER GTC":
                agentexecutor = AgentExecutor(agent=agent_additions, tools=tools, verbose=True, handle_parsing_errors=True)
                input_prompt = "Please analyze the documents and provide the additions."
            else:
                agentexecutor = AgentExecutor(agent=agent_others, tools=tools, verbose=True, handle_parsing_errors=True)
                input_prompt = f"Conduct a comparative analysis of the {entity} in both the ABB-GTC and the Supplier-GTC. Provide small and accurate summaries."
            response = agentexecutor.invoke({"input": input_prompt})
            answer = response['output']
            if entity == "ADDITIONS IN SUPPLIER GTC":
                parsed = string_to_dict(answer)
                # Add empty lists for the other sections
                parsed["similarities"] = []
                parsed["removals"] = []
                parsed["differences"] = []
                return entity, parsed
            else:
                parsed = convert_to_dict(answer)
                return entity, parsed
        except Exception as e:
            retries += 1
            if retries > max_retries:
                raise e
            time.sleep(backoff_factor * (2 ** retries))
    raise Exception(f"Max retries exceeded for entity: {entity}")

@app.route('/process_IS_GTC', methods=['POST'])
def process_files():
    try:
        # 1. Parse inputs
        index_name = request.json.get('index_name')
        supplier_gtc_url = request.json.get('supplier_gtc_url')
        company_gtc_url = request.json.get('company_gtc_url')
        folder_name = request.json.get('folder_name')
        if not supplier_gtc_url:
            return jsonify({'error': 'Supplier GTC file URL must be provided'}), 400

        # 2. Build file descriptors for ABB and Supplier
        files = [{"name": "Supplier-GTC", "url": supplier_gtc_url}]
        if company_gtc_url:
            files.append({"name": "ABB-GTC", "url": company_gtc_url})
        elif index_name:
            files.append({"name": "ABB-GTC", "vector_store_index": index_name})

        # 3. Initialize LangChain tools
        tools = []
        for file in files:
            if 'vector_store_index' in file:
                vector_download = blobstorageprocessor.download_blob(AZURE_VECTOR_STORAGE_CONTAINER_NAME, index_name)
                stream = vector_download.readall()
                retriever_store = FAISS.deserialize_from_bytes(embeddings=embeddings, serialized=stream)
                retriever = retriever_store.as_retriever(search_type="similarity", search_kwargs={"k": 10})
                blob_name = index_name + '.pdf'
                abb_entities = extract_entities_from_blob(AZURE_PRELOADED_CONTAINER_NAME, blob_name).keys()
            else:
                container, blob_name = parse_blob_url(file['url'])
                stream = blobstorageprocessor.download_blob(container, blob_name)
                if file['name'] == 'ABB-GTC':
                    abb_entities = extract_entities_from_blob(container, blob_name).keys()
                text = process_file(file['url'], os.path.splitext(blob_name)[1], stream)
                # guard against unwanted Sheet outputs
                if 'Sheet: Sheet1' in text:
                    return jsonify({
                        "similarities": [],
                        "additions": [],
                        "removals": [],
                        "differences": []
                    }), 200
                # split and index
                splitter = MarkdownHeaderTextSplitter(headers_to_split_on=[('#','H1'),('##','H2'),('###','H3')])
                splits = splitter.split_text(text)
                faiss_index = FAISS.from_documents(splits, embedding=embeddings)
                bm25 = BM25Retriever.from_texts([text])
                retriever = EnsembleRetriever(retrievers=[bm25, faiss_index.as_retriever()], weights=[0.5,0.5])
            tools.append(
                Tool(
                    args_schema=DocumentInput,
                    name=file["name"],
                    description=f"useful when you want to answer questions about {file['name']}",
                    func=RetrievalQA.from_chain_type(llm=llm, retriever=retriever)
                )
            )
        # Define the first system template for "Additions in Supplier GTC"
        template_additions = """You are an AI assistant specializing in document comparison.

**Task**:

- Compare two documents: **ABB-GTC** and **Supplier-GTC**.
- Identify clauses present in **Supplier-GTC** but **absent** in **ABB-GTC** (Additions).

**Instructions**:

- Provide concise summaries for each addition.
- Do **not** include any extra text or explanations.
- Return the result as a list.
- Ensure all strings are properly quoted.
- **Escape any curly braces in your output.**

**Output Format**:

[
    "Summary of addition 1",
    "Summary of addition 2"
]
"""

        # Define the second system template for other entities
        template_others="""You are an AI assistant specializing in document comparison. You have been provided with the full text of two documents: **ABB-GTC** and **Supplier-GTC**.

**Task**:

1. Read both documents thoroughly.
2. Compare and categorize clauses into the following four sections:
   - **Similarities**: Clauses that are identical or very similar in both documents.
   - **Additions**: Clauses that appear in **Supplier-GTC** but **do not appear** in **ABB-GTC**.
   - **Removals**: Clauses that appear in **ABB-GTC** but **do not appear** in **Supplier-GTC**.
   - **Differences**: Clauses that exist in both documents but differ in wording or meaning.

**Important Requirements**:

- **Only** use the exact content from the two provided documents. 
- **Do not** assume, infer, or fabricate any information not explicitly present in the documents.
- If there is no entry for a particular section, provide an empty JSON array (`[]`) for that section.
- Your output **must** be formatted as a valid JSON object with the following keys: `"similarities"`, `"additions"`, `"removals"`, and `"differences"`.
- **Do not** include any additional commentary or text outside of the JSON object.
- **Do not** include code snippets, function calls, or any non-JSON text in your response.
- Escape any curly braces in the text content to avoid invalid JSON formatting.
- Use double asterisks (**) around important terms (e.g., **Delivery**, **Payment Terms**) within your summaries.
- Highlight the clause number reference of **ABB-GTC** and **Supplier-GTC** in the response

**Output Format** (example structure):
```json
{{
  "similarities": [
    "Summary of similarity 1",
    "Summary of similarity 2"
  ],
  "additions": [
    "Summary of addition 1",
    "Summary of addition 2"
  ],
  "removals": [
    "Summary of removal 1",
    "Summary of removal 2"
  ],
  "differences": [
    "Summary of difference 1",
    "Summary of difference 2"
  ]
}}
"""
        # Create two prompt templates
        prompt_template_additions = ChatPromptTemplate.from_messages([
            ("system", template_additions),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])

        prompt_template_others = ChatPromptTemplate.from_messages([
            ("system", template_others),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])

        # 4. Build agents
        agent_additions = create_openai_functions_agent(tools=tools, llm=llm, prompt=prompt_template_additions)
        agent_others   = create_openai_functions_agent(tools=tools, llm=llm, prompt=prompt_template_others)

        # 5. Extract entity list
        entities = [re.split(r"^\d+.", e)[1].strip() for e in abb_entities]
        total_entities = entities + ["ADDITIONS IN SUPPLIER GTC", "DELTA SUMMARY"]

        # 6. Parallel processing of normal entities
        result_dict = {}
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = {executor.submit(process_entity_with_retries, e, agent_additions, agent_others, tools): e for e in entities}
            for fut in as_completed(futures):
                ent = futures[fut]
                try:
                    _, parsed = fut.result()
                    result_dict[ent] = parsed
                except Exception as err:
                    logger.error(f"Error on {ent}: {err}")
                    result_dict[ent] = {'error': str(err)}

        # 7. Handle ADDITIONS separately
        _, adds = process_entity_with_retries("ADDITIONS IN SUPPLIER GTC", agent_additions, agent_others, tools)
        result_dict["ADDITIONS IN SUPPLIER GTC"] = adds
        
        # 8. Build Δ summary
        DifferenceSummary = []
        for e in entities:
            DifferenceSummary.extend(result_dict.get(e, {}).get('differences', []))
        flat_diff = safe_join(DifferenceSummary, sep="\n")
        from langchain_core.messages import HumanMessage
        summary = llm.invoke([HumanMessage(content=(
            "You are an AI assistant. Summarize the following differences into a single short paragraph "
            "focusing only on the most essential points:\n\n" + flat_diff
        ))]).content.strip()
        result_dict["DELTA SUMMARY"] = {
            'differences': [summary],
            'similarities': [],
            'additions': [],
            'removals': []
        }
        sorted_dict = {key: result_dict[key] for key in total_entities if key in result_dict}
        # 9. Clause agreement analysis
        AgreedClauses = []
        DisagreedClauses = []
        for e in entities:
            sims = result_dict[e].get('similarities', [])
            if any(s.strip() for s in sims):
                AgreedClauses.append(e)
            else:
                DisagreedClauses.append(e)

        # 10. Red/blue filtering
        red_clauses = [c for c in clauses['redClauses'] if c in entities]
        blue_clauses = [c for c in clauses['blueClauses'] if c in entities]
        agreed_red_clauses = [c for c in AgreedClauses if c in red_clauses]
        disagreed_red_clauses = [c for c in DisagreedClauses if c in red_clauses]
        agreed_blue_clauses = [c for c in AgreedClauses if c in blue_clauses]
        disagreed_blue_clauses = [c for c in DisagreedClauses if c in blue_clauses]

        # Assuming you've already defined red_clauses_filtered and blue_clauses_filtered
        def get_clause_type(entity):
            if entity in red_clauses:
                return "Red Clause"
            elif entity in blue_clauses:
                return "Blue Clause"
            else:
                return ""
        # Calculate counts of agreed red and blue clauses dynamically
        total_blue_clauses_count = len(blue_clauses)
        agreed_blue_clauses_count = len(agreed_blue_clauses)
        total_red_clauses_count = len(red_clauses)
        agreed_red_clauses_count = len(agreed_red_clauses)
        total_clause_count = len(entities)
        agreed_clause_count = len(AgreedClauses)

        # 11. Percentages
        AgreedClausePercentage = len(AgreedClauses)/len(entities)*100 if entities else 0
        AgreedRedClausePercentage = len(agreed_red_clauses)/len(red_clauses)*100 if red_clauses else 0
        AgreedBlueClausesPercentage= len(agreed_blue_clauses)/len(blue_clauses)*100 if blue_clauses else 0

        # 12. Risk analysis DataFrame
        risk_data = [
            ["Agreed Blue clause percentage", f"{AgreedBlueClausesPercentage}%"],
            ["Agreed Red clause percentage", f"{AgreedRedClausePercentage}%"],
            ["Agreed Clause Percentage", f"{AgreedClausePercentage}%"],
            ["Disagreed Red Clauses", safe_join(disagreed_red_clauses, sep=", ")],
            ["Disagreed Blue Clauses", safe_join(disagreed_blue_clauses, sep=", ")]
        ]
        risk_df = pd.DataFrame(risk_data, columns=["Risk analysis", "Value"])

        # 13. Create Excel and upload
        df = pd.DataFrame(sorted_dict).T.reset_index().rename(columns={"index":"Entities"})
        if 'error' in df.columns:
            df.drop(['error'], axis=1, inplace=True)
        # Apply the function to create a new 'clause' column
        df["clause"] = df["Entities"].apply(get_clause_type)
        excel_bytes = create_excel_with_formatting_local(df, 'en', "Output", risk_df=risk_df)
        blob_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING_DOWNLOAD_EXCEL)
        container = blob_client.get_container_client(AZURE_DOWNLOAD_EXCEL_STORAGE_CONTAINER_NAME)
        blob_name = f"Comparison_{uuid.uuid4().hex[:8]}.xlsx"
        container.upload_blob(blob_name, excel_bytes, overwrite=True)

        blob_service_client = BlobServiceClient.from_connection_string(AZURE_BLOB_STORAGE_CONNECTION_STRING)

        if folder_name:
        # Parse the container from either supplier_gtc_url or company_gtc_url
        # They should be in the same container, so let's parse from the supplier_gtc_url:
            container_name, _ = parse_blob_url(supplier_gtc_url)
            
            # If you prefer to parse from company_gtc_url:
            # container_name, _ = parse_blob_url(company_gtc_url)

            container_client = blob_service_client.get_container_client(container_name)

            # This will list all blobs that start with, e.g., "rfq_202308301200_123e4567/"
            blobs_to_delete = container_client.list_blobs(name_starts_with=folder_name)
            for blob in blobs_to_delete:
                container_client.delete_blob(blob.name)
            logger.info(f"Deleted blobs in folder: {folder_name}")

        # 15. Return JSON
        return jsonify({
            'result': sorted_dict,
            'AgreedClauses': AgreedClauses,
            'DisagreedClauses': DisagreedClauses,
            'blob_name': blob_name,
            'AgreedRedClauses': agreed_red_clauses,
            'DisagreedRedClauses': disagreed_red_clauses,
            'AgreedBlueClauses': agreed_blue_clauses,
            'DisagreedBlueClauses': disagreed_blue_clauses,
            'Entities': entities,
            'RedClauses': red_clauses,
            'BlueClauses': blue_clauses,
            'TotalBlueClausesCount': total_blue_clauses_count,
            'AgreedBlueClausesCount': agreed_blue_clauses_count,
            'TotalRedClausesCount': total_red_clauses_count,
            'AgreedRedClausesCount': agreed_red_clauses_count,
            'TotalClauseCount': total_clause_count,
            'AgreedClauseCount': agreed_clause_count
        }), 200

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/risk_percentage', methods=['POST'])
def risk_percentage():
    try:
        logger.info("Calculating risk percentages.")

        # Get the lists from the request JSON
        data = request.json
        AgreedClauses = data.get('AgreedClauses', [])
        DisagreedClauses = data.get('DisagreedClauses', [])
        AgreedRedClauses = data.get('AgreedRedClauses', [])
        DisagreedRedClauses = data.get('DisagreedRedClauses', [])
        AgreedBlueClauses = data.get('AgreedBlueClauses', [])
        DisagreedBlueClauses = data.get('DisagreedBlueClauses', [])

        # Get total counts from clauses.py
        total_entities = len(data.get('Entities', []))
        total_red_clauses = len(data.get('RedClauses', []))
        total_blue_clauses = len(data.get('BlueClauses', []))

        # Calculate percentages
        AgreedClausePercentage = (len(AgreedClauses) / total_entities) * 100 if total_entities else 0
        DisagreedClausePercentage = (len(DisagreedClauses) / total_entities) * 100 if total_entities else 0
        AgreedRedClausePercentage = (len(AgreedRedClauses) / total_red_clauses) * 100 if total_red_clauses else 0
        DisagreedRedClausesPercentage = (len(DisagreedRedClauses) / total_red_clauses) * 100 if total_red_clauses else 0
        AgreedBlueClausesPercentage = (len(AgreedBlueClauses) / total_blue_clauses) * 100 if total_blue_clauses else 0
        DisagreedBlueClausesPercentage = (len(DisagreedBlueClauses) / total_blue_clauses) * 100 if total_blue_clauses else 0

        # Determine vendor's risk position based on AgreedClausePercentage
        if AgreedClausePercentage > 80:
            risk_position = "Low Risk"
        elif 60 <= AgreedClausePercentage <= 80:
            risk_position = "Moderate Risk"
        elif AgreedClausePercentage < 50:
            risk_position = "Higher Risk"
        else:
            risk_position = "Moderate Risk"  # Default case if between 50 and 60

        # Return the percentages
        return jsonify({
            'AgreedClausePercentage': AgreedClausePercentage,
            'DisagreedClausePercentage': DisagreedClausePercentage,
            'AgreedRedClausePercentage': AgreedRedClausePercentage,
            'DisagreedRedClausesPercentage': DisagreedRedClausesPercentage,
            'AgreedBlueClausesPercentage': AgreedBlueClausesPercentage,
            'DisagreedBlueClausesPercentage': DisagreedBlueClausesPercentage,
            'RiskPosition': risk_position
        }), 200

    except Exception as e:
        logger.error(f"Error in risk_percentage function: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/download', methods=['GET','POST'])
def download_blob():
    try:
        # Retrieve the blob_name from the query parameters
        blob_name = request.json.get('blob_name')
        if not blob_name:
            return jsonify({'error': 'blob_name parameter is required'}), 400

        # Use the container name for Excel file downloads (update if needed)
        container_name = AZURE_DOWNLOAD_EXCEL_STORAGE_CONTAINER_NAME

        # Download the blob using your helper
        blob_processor = BlobStorageProcessor()
        download_stream = blob_processor.download_blob(container_name, blob_name)
        file_content = download_stream.readall()

        # Create a local 'downloads' folder if it doesn't exist
        downloads_folder = 'downloads'
        os.makedirs(downloads_folder, exist_ok=True)

        # Construct the local file path and write the file to disk
        local_file_path = os.path.join(downloads_folder, os.path.basename(blob_name))
        with open(local_file_path, 'wb') as f:
            f.write(file_content)

        return jsonify({'message': f"File saved to {local_file_path}"}), 200

    except Exception as e:
        logger.error(f"Error in download_blob function: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run()