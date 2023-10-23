def to_chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

def center(string:str, width:int = 0, sep:str = ' '):
    left = (width - len(string)) // 2
    right = width - len(string) - left
    return f"{sep * left}{string}{sep * right}"