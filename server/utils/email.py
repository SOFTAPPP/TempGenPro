import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_otp_email(email: str, otp: str):
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")

    subject = "Verify your email for TempGenPro"
    body = (
        f"Welcome to TempGenPro!\n\n"
        f"Your verification code is: {otp}\n\n"
        f"Please enter this code in the app to verify your account.\n"
        f"This code will expire in 10 minutes.\n"
    )

    if not smtp_user or not smtp_pass:
        print("\n=== [LOCAL OTP NOTIFICATION] ===")
        print(f"To: {email}")
        print(f"OTP: {otp}")
        print("===============================\n")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, email, msg.as_string())
        server.quit()
        print(f"[Email Utils] OTP successfully sent to {email}")
    except Exception as e:
        print(f"[Email Utils Error] SMTP delivery failed: {e}")
