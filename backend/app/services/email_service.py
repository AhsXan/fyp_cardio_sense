"""
Email Service - Handles sending emails via SMTP (Gmail)
Only sends to @gmail.com addresses
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "CardioSense")


class EmailService:
    """
    Service for sending emails via SMTP
    """
    
    @staticmethod
    def is_gmail(email: str) -> bool:
        """
        Check if email is a Gmail address
        """
        return email.lower().endswith("@gmail.com")
    
    @staticmethod
    def send_otp_email(to_email: str, otp_code: str, purpose: str = "verification") -> bool:
        """
        Send OTP via email to Gmail addresses only
        Returns: True if sent successfully, False otherwise
        """
        # Only send to Gmail addresses
        if not EmailService.is_gmail(to_email):
            print(f"\n⚠️ Email {to_email} is not Gmail - OTP will be printed to terminal instead")
            return False
        
        # Check if SMTP is configured
        if not SMTP_USERNAME or not SMTP_PASSWORD or SMTP_USERNAME == "your-email@gmail.com":
            print(f"\n⚠️ SMTP not configured - OTP will be printed to terminal")
            print("💡 To enable Gmail OTP: Set SMTP_USERNAME and SMTP_PASSWORD in .env file")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
            msg['To'] = to_email
            msg['Subject'] = f"Your CardioSense OTP Code - {purpose.title()}"
            
            # Email body
            html = f"""
            <html>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #3B82F6; margin: 0;">CardioSense</h1>
                            <p style="color: #666; margin: 5px 0;">AI-Powered Cardiac Analysis</p>
                        </div>
                        
                        <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0;">
                            <h2 style="color: #1E40AF; margin-top: 0;">Your OTP Code</h2>
                            <p style="color: #666; margin-bottom: 15px;">Purpose: <strong>{purpose.title()}</strong></p>
                            <div style="background-color: white; border: 2px dashed #3B82F6; border-radius: 8px; padding: 15px; text-align: center; margin: 15px 0;">
                                <span style="font-size: 32px; font-weight: bold; color: #1E40AF; letter-spacing: 8px;">{otp_code}</span>
                            </div>
                            <p style="color: #666; font-size: 14px; margin-top: 15px;">
                                ⏰ This code will expire in <strong>15 minutes</strong>
                            </p>
                        </div>
                        
                        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
                            <p style="color: #92400E; margin: 0; font-size: 14px;">
                                <strong>Security Notice:</strong> If you didn't request this code, please ignore this email. Never share your OTP with anyone.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                            <p style="color: #9CA3AF; font-size: 12px; margin: 5px 0;">
                                © 2026 CardioSense - AI-Powered Cardiac Sound Analysis
                            </p>
                            <p style="color: #9CA3AF; font-size: 12px; margin: 5px 0;">
                                This is an automated message, please do not reply.
                            </p>
                        </div>
                    </div>
                </body>
            </html>
            """
            
            # Attach HTML content
            html_part = MIMEText(html, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
            
            print(f"\n✅ OTP Email Sent Successfully to {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError:
            print(f"\n❌ SMTP Authentication Failed - Check your app password")
            print("💡 Use an app-specific password, not your regular Gmail password")
            return False
        except Exception as e:
            print(f"\n❌ Failed to send OTP email: {str(e)}")
            return False
