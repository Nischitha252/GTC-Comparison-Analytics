from pandas.io.excel._xlsxwriter import XlsxWriter
from flask import jsonify
import re
import io
import pandas as pd
import logging

from .Azure_Translator import Translator
from .clauses import clauses  # Import clauses

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_excel_with_formatting_local(df, language, sheet_name, risk_df=None):
    logger.info("Excel Formatting has Started")
    translator = Translator()
    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')

    workbook = writer.book
    bold = workbook.add_format({'bold': True})
    

    if sheet_name not in writer.sheets:
        worksheet = writer.book.add_worksheet("Output")
        worksheet.set_column(0, 0, 40)
        worksheet.set_column(1, 6, 70)

        header_format = workbook.add_format(
            {
                "bold": True,
                "text_wrap": True,
                "valign": "top",
                "fg_color": "#ADD8E6",
                "border": 1,
                "align": "center",
            }
        )
        top_aligned_format = workbook.add_format({"text_wrap": True, "valign": "top"})

    def write_formatted_cell(row, col, value):
        if not isinstance(value, str):
            if isinstance(value, list):
                value = ' '.join(map(str, value))
            else:
                value = str(value)

        parts = re.split(r'(\*\*.*?\*\*)', value)
        formatted_parts = []
        bold_format = workbook.add_format({'bold': True})

        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                formatted_parts.append(bold_format)
                formatted_parts.append(part[2:-2])
            elif part:
                formatted_parts.append(part)

        if len(formatted_parts) < 2:
            worksheet.write(row, col, value, top_aligned_format)
        else:
            worksheet.write_rich_string(row, col, *formatted_parts, top_aligned_format)

    try:
        # Output sheet logic remains unchanged
        df.to_excel(writer, sheet_name="Output", startrow=1, header=False, index=False)

        for col_num, value in enumerate(df.columns.values):
            translated_value = translator.translate(value, language)
            worksheet.write(0, col_num, translated_value, header_format)

        for row_num in range(1, len(df) + 1):
            for col_num in range(1, len(df.columns)):
                write_formatted_cell(row_num, col_num, df.iloc[row_num - 1, col_num])
            worksheet.write(row_num, 0, df.iloc[row_num - 1, 0], top_aligned_format)

        # Add Risk analysis sheet if provided
        if risk_df is not None:
            risk_df.to_excel(writer, sheet_name="Risk analysis", index=False)
            risk_ws = writer.sheets["Risk analysis"]
            risk_ws.set_column(0, 0, 40)
            risk_ws.set_column(1, 1, 70)

            risk_header_format = workbook.add_format({
                "bold": True,
                "text_wrap": True,
                "valign": "top",
                "fg_color": "#ADD8E6",
                "border": 1,
                "align": "center",
            })

            for col_num, val in enumerate(risk_df.columns.values):
                risk_ws.write(0, col_num, val, risk_header_format)

            risk_top_aligned = workbook.add_format({"text_wrap": True, "valign": "top"})
            for row_num in range(1, len(risk_df) + 1):
                for col_num in range(len(risk_df.columns)):
                    cell_value = risk_df.iloc[row_num - 1, col_num]
                    if not isinstance(cell_value, str):
                        cell_value = str(cell_value)
                    risk_ws.write(row_num, col_num, cell_value, risk_top_aligned)

        writer.close()
        logger.info("Excel Formatting has Completed")
    except AttributeError as e:
        logger.error(f"Error Formatting the excel file: {str(e)}")
        raise e

    return output.getvalue()