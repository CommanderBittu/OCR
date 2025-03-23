# Use an official Python image as the base
FROM python:3.10

# Set the working directory inside the container
WORKDIR /app

# Copy the entire project into the container
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port Flask will run on
EXPOSE 7860

# Run the Flask app with Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:7860", "app:app"]
