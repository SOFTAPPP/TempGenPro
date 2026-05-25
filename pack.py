import os
import zipfile

def zipdir(path, ziph, exclude_dirs):
    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            file_path = os.path.join(root, file)
            ziph.write(file_path, arcname=file_path)

if __name__ == '__main__':
    exclude = {'venv', 'node_modules', '__pycache__', '.git', '.env'}
    with zipfile.ZipFile('deploy.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
        if os.path.exists('server'):
            zipdir('server', zipf, exclude)
        if os.path.exists('ai_service'):
            zipdir('ai_service', zipf, exclude)
        if os.path.exists('ecosystem.config.js'):
            zipf.write('ecosystem.config.js')
    print("Created deploy.zip successfully!")
