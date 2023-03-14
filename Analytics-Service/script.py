from math import inf
import mysql.connector
from mysql.connector import Error
from pymongo import MongoClient
import socket
import json

def get_database():
    print("Connecting to MongoDB...", flush=True)
    # Provide the mongodb atlas url to connect python to mongodb using pymongo
    CONNECTION_STRING = "mongodb://mongodb:27017/"

    # Create a connection using MongoClient. You can import MongoClient or use pymongo.MongoClient
    client = MongoClient(CONNECTION_STRING)
    print("Connected to mongoDB-Server ^_^ ", flush=True)
    # Create the database for our example (we will use the same database throughout the tutorial
    db = client['mongodb']
    
    return db

def getMax(data):
    max = -1
    for num in data:
        if(num > max):
            max = num
    return max

def getMin(data):
    min = inf
    for num in data:
        if(num < min):
            min = num
    return min

def getAvg(data):
    sum = 0
    for num in data:
        sum += num
    return round(sum / len(data), 2)

def createDefaultMongoCollection(dbname):
    newCollection = dbname['numbers']
    defaultItem = {
        "id" : 1,
        "min": -1,
        "max": -1,
        "avg": -1
    }
    newCollection.insert_one(defaultItem)

def connectToSQL():
    connection = 0
    print("connecting to MySQL...", flush = True)
    try:
        connection = mysql.connector.connect(
            host = "mysql_server",
            user = "dan",
            password = "secret",
            database = "test_db",
            port = "3306"
            )
        print("Connected to MySQL!! ^_^", connection.get_server_info(), flush= True)
        
    except Error as e:
        print("Something weeeew Happened wrong :P --> ", e, flush= True)
    return connection
    
def getNewValues(record):
    data = []
    for tub in record:
        data.append(tub[0])

    if(len(data) > 0):
        max = getMax(data)
        min = getMin(data)
        avg = getAvg(data)
    else:
        max = -1
        min = -1
        avg = -1
    print("This is all data in MySQL:", data)
    print("This is min:" , min)
    print("This is max:" , max)
    print("This is avg:" , avg)
    return max, min, avg
    
def updateMongoValues(max, min, avg):
    dbname = get_database()
    print("connected to MongoDB-DataBase!! ^_^")

    collection_name = dbname['numbers']
    dbData = []
    for x in collection_name.find():
        dbData.append(x)

    if(len(dbData) == 0):
        createDefaultMongoCollection(dbname)
    
    filter = {"id" : 1}
    newvalues = {"$set" : {"min":min, "max":max, "avg":avg}}

    collection_name.update_one(filter, newvalues)
    print("Updated MongoDB ^_^", flush=True)


def doTheJob():
    SQLconnection = connectToSQL()
    cursor = SQLconnection.cursor()
    cursor.execute("SELECT number FROM numbers")
    max, min, avg = getNewValues(cursor.fetchall())
    updateMongoValues(max, min, avg)
    

print("Python is working ^_^", flush=True)

HOST = "analytics-service"
PORT = 65432

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

s.bind((HOST, PORT))
s.listen()
while(True):
    conn, addr = s.accept()
    print(f"Connected by {addr}")
    doTheJob()
    conn.sendall(b"done")
