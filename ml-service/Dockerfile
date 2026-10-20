FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
COPY models/ ./models/
EXPOSE 8001
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD python -c "import os,urllib.request,sys; p=os.getenv('PORT','8001'); sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:'+p+'/health',timeout=3).status==200 else 1)"
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}"]
