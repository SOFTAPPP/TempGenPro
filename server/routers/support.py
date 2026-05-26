import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, EmailStr

router = APIRouter()

class SupportRequest(BaseModel):
    name: str
    email: EmailStr
    message: str

def send_support_email(name: str, email: str, message: str):
    recipient = "support.tempgenpro@gmail.com"
    
    # Read SMTP configuration from environment variables
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")
    
    # Format the email content
    subject = f"[Support Inquiry] from {name}"
    body = (
        f"You have received a new support inquiry from TempGenPro:\n\n"
        f"Name: {name}\n"
        f"Email: {email}\n\n"
        f"Message:\n"
        f"----------------------------------------\n"
        f"{message}\n"
        f"----------------------------------------\n"
    )
    
    # Verify if SMTP is configured
    if not smtp_user or not smtp_pass:
        # Graceful fallback: log to console during development/testing
        print("\n=== [LOCAL SUPPORT TICKET RECEIVED] ===")
        print(f"To: {recipient}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body}")
        print("=======================================\n")
        return
        
    try:
        # Create message container
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = recipient
        msg['Reply-To'] = email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect to SMTP server
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, recipient, msg.as_string())
        server.quit()
        print(f"[Support Router] Email successfully sent for {email}")
    except Exception as e:
        # If email delivery fails, print details
        print(f"[Support Router Error] SMTP delivery failed: {e}")

@router.post("")
async def submit_support(req: SupportRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_support_email, req.name, req.email, req.message)
    return {"status": "success", "message": "Inquiry logged. Transmission proceeding in the background."}

