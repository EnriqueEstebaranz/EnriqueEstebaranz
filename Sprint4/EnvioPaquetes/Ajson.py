# Importo el módulo JSON -> JavaScript Object Notation)
import json

# Nombre del archivo de entrada
input_filename = "netgui.nkp"

# "r" leo el archivo .nkp


with open(input_filename, "r") as file:
    netgui_nkp = file.read()

# Inicializa listas vacías para almacenar nodos y conexiones
nodes = []
connections = []

# Divide por saltos de líneas
lineas = netgui_nkp.split('\n')

linea_anterior = None
# Recorre cada línea
for line in lineas:
    # Ignora las líneas vacías
    if not line.strip():
        continue
    
    # Dividir la línea por el punto y coma
    parts = line.split(';')
    
    # Si la línea contiene información de posición y tipo de nodo
    if 'position' in parts[0]:
        position_parts = parts[0].split('(')[1].split(')')[0].split(',')
        x, y = (float(position_parts[0])/20)-25, (float(position_parts[1])/20)-30
        node_type = parts[1].strip().split('(')[0]
        node_name = parts[1].strip().split('"')[1]
        
        # Agregar el nodo a la lista
        nodes.append({"position": [x, y], "type": node_type, "name": node_name})
    
    # Si la línea contiene información de conexión
    elif 'To' in parts[0]:
        source = parts[0].split('"')[1]
        target = linea_anterior.split('"')[1]
        
        # Agregar la conexión a la lista
        connections.append({"type": "link", "from": source, "to": target})
    
    # Actualizar la línea anterior con la línea actual
    linea_anterior = line

# Contiene el diccionario de datos, si quiero dos archivos puedo separarlo y crear uno para cada valor.
data = {"nodes": nodes, "connections": connections}

# Cambio el nombre del archivo, reemplazando .nkp por .json
output_filename = input_filename.replace(".nkp", ".json")

# "w" -> write, para escribir el archivo .json
with open(output_filename, "w") as json_file:
    # Convertir a formato JSON y escribir en el archivo con 2 espacios (indent)
    json.dump(data, json_file, indent=2)

print(f"El archivo JSON se ha creado correctamente:  {output_filename}" )


