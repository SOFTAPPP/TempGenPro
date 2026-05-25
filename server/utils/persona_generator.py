import random

NAMES = [
  "Alexander 'Zar' Volkov", "Cassandra Moon", "Dr. Elias Sterling", "Sasha Keely", 
  "Jordan 'Rook' Vance", "Elena Rossi", "Marcus Thorne", "Talia Al-Ami", 
  "Liam O'Sullivan", "Zoe 'Glitch' Chen", "Dominic Vance", "Anya Sokolov",
  "Hiroshi Tanaka", "Isabella 'Viper' Vance", "Silas 'Hush' Morello"
]

JOBS = [
  "Senior Security Architect", "Cloud Infrastructure Lead", "Cryptology Research Analyst",
  "DevOps Site Reliability Engineer", "Digital Forensic Investigator", "AI Ethics Consultant",
  "Full-Stack Stealth Developer", "Network Intelligence Strategist", "High-Frequency Data Analyst",
  "Quantum Computing Engineer", "Autonomous Systems Architect", "Cyber-Crisis Manager"
]

BIOS = [
  "Specializing in decentralized identity and secure tunnel architecture. Prefers working off the grid.",
  "Building mission-critical cloud infrastructure for silicon valley startups. Always on a VPN.",
  "Researching the intersection of neural networks and privacy protocols. Cyber-security enthusiast.",
  "Expert in high-availability systems and data encryption standard (AES-256).",
  "Navigating the deep-web for threat intelligence and vulnerability management.",
  "Designing ethical AI guardrails for the next generation of digital communication."
]

def generate_persona():
    name = random.choice(NAMES)
    job = random.choice(JOBS)
    bio = random.choice(BIOS)
    avatar_id = random.randint(1, 70)
    avatar = f"https://i.pravatar.cc/150?u={avatar_id}"

    return {
        "name": name,
        "job": job,
        "bio": bio,
        "avatar": avatar
    }
