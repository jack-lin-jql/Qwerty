import sys
sys.path.insert(0, 'mysql/')

import mysql.connector
from mysql.connector import Error

class Bot():
    
    def __init__(self, host='localhost',
                 user='root', password='root', database='mail'):
        
        self._host = host
        self._user = user
        self._password = password
        self._database = database
        
        self._connection = self.connect()
        
    def __str__(self):
        return "connected to: " + self._host
    
    def connect(self):
        try:
            conn = mysql.connector.connect(host=self._host, 
                                           user=self._user,
                                           password=self._password, 
                                           database=self._database)
            if conn.is_connected():
                print('Connected to MySQL database') 
                
            return conn
        except Error as e:
            print(e)
        
        return 
            
    def close(self):
        self._connection.close()
            
b = Bot()
b.close()

             