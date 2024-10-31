import os

def to_chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

def center(string:str, width:int = 0, sep:str = ' '):
    left = (width - len(string)) // 2
    right = width - len(string) - left
    return f"{sep * left}{string}{sep * right}"

def path_exist(path):
    try:
        os.stat(path)
        return True
    except OSError:
        return False

def list_files(directory, current_path=""):
    ignore_dirs = {"/fonts", "/utils", "/lib"}
    
    for item in os.listdir(directory + current_path):
        full_path = directory + current_path + "/" + item
        relative_path = current_path + "/" + item

        if full_path.startswith("/"):
            full_path = full_path[1:]
        
        if relative_path in ignore_dirs:
            continue
        
        try:
            os.listdir(directory + current_path + "/" + item)
            yield from list_files(directory, relative_path)
        except OSError:
            yield full_path

def get_audio_files() -> list:
    audio_files = []
    for file_path in list_files("/"):
        if file_path.endswith("mp3") or file_path.endswith("wav"):
            audio_files.append(file_path[1:])
    return audio_files