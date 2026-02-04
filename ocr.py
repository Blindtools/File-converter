import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image
import io

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    Extracts text from a PDF file using Tesseract OCR.
    Converts each page of the PDF to an image and then performs OCR.
    """
    try:
        # Convert PDF bytes to a list of PIL images
        images = convert_from_bytes(pdf_content)
        
        full_text = ""
        for i, image in enumerate(images):
            # Perform OCR on each page
            text = pytesseract.image_to_string(image)
            full_text += f"--- Page {i+1} ---\n{text}\n\n"
            
        return full_text.strip()
    except Exception as e:
        raise Exception(f"OCR processing failed: {str(e)}")

def extract_text_from_image(image_content: bytes) -> str:
    """
    Extracts text from an image file using Tesseract OCR.
    """
    try:
        image = Image.open(io.BytesIO(image_content))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        raise Exception(f"Image OCR processing failed: {str(e)}")
