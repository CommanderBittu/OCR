import os
import base64
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from ocr import HindiTextRecognizer
from flask_cors import CORS
import cv2

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        app.logger.error('No file part in the request')
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        app.logger.error('No selected file')
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        recognizer = HindiTextRecognizer()

        try:
            recognized_text, boxes, img = recognizer.detect_and_recognize_text(filepath)

            # Enhanced debugging
            app.logger.info(f"Image shape: {img.shape if img is not None else 'None'}")

            if img is None:
                app.logger.error("Image is None")
                return jsonify({'error': 'Failed to process image: Image is None'}), 500

            # Save the processed image with debug info
            processed_img_path = os.path.join(app.config['UPLOAD_FOLDER'], 'processed_' + filename)
            success = cv2.imwrite(processed_img_path, img)
            app.logger.info(f"Image save success: {success}")
            app.logger.info(f"Saved to: {processed_img_path}")

            # Check if the file was created and its size
            if os.path.exists(processed_img_path):
                file_size = os.path.getsize(processed_img_path)
                app.logger.info(f"Processed image file size: {file_size} bytes")
            else:
                app.logger.error("Processed image file was not created")

            # Encode to base64 with error handling
            try:
                with open(processed_img_path, 'rb') as img_file:
                    img_data = img_file.read()
                    processed_image_base64 = base64.b64encode(img_data).decode('utf-8')
                    app.logger.info(f"Base64 encoded length: {len(processed_image_base64)}")
            except Exception as e:
                app.logger.error(f"Base64 encoding error: {str(e)}")
                raise

            response_data = {
                "text": recognized_text,
                "processed_image": processed_image_base64
            }

            app.logger.info("Response data prepared successfully")
            return jsonify(response_data)

        except Exception as e:
            app.logger.error(f'Error during OCR processing: {str(e)}')
            app.logger.exception("Full exception:")
            return jsonify({'error': f'Failed to process image: {str(e)}'}), 500

    app.logger.error('Invalid file type')
    return jsonify({'error': 'Invalid file type'}), 400


if __name__ == '__main__':
    app.run(debug=True)