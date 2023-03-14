import socket
import json
import socketserver
import time
import threading


def checkData(signInData, portNumber):
    UserName = "user" if(portNumber == 6000) else "admin"
    UserPass = "user" if(portNumber == 6000) else "admin"
    if(signInData["UserName"].lower() == UserName and signInData["Password"].lower() == UserPass):
        return True
    else:
        return False


class ThreadedTCPRequestHandler(socketserver.BaseRequestHandler):
    # socket.socket.getsockname
    def handle(self):
        THIS_PORT_NUMBER = self.request.getsockname()[1]
        print("Data recived from port:", THIS_PORT_NUMBER, flush=True)
        self.data = self.request.recv(1024).strip()
        # print ("%s wrote: " % self.client_address[0])
        # print (self.data)
        signInData = self.data.decode('utf-8')
        res = json.loads(signInData)
        # print(signInData)
        # print(res)
        
        flag = checkData(res, THIS_PORT_NUMBER)
        if(flag):
            print("Valid Data", flush=True)
            self.request.send(b"yes")
        else:
            print("Invalid Data!", flush=True)
            self.request.send(b"no")
        # self.request.send(self.data.upper())
        

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    pass

if __name__ == "__main__":
    print("Authenticator is ready ^_^", flush=True)

    HOST = 'authenticator'
    PORT_A = 6000
    PORT_B = 6001

    server_A = ThreadedTCPServer((HOST, PORT_A), ThreadedTCPRequestHandler)
    server_B = ThreadedTCPServer((HOST, PORT_B), ThreadedTCPRequestHandler)

    server_A_thread = threading.Thread(target=server_A.serve_forever)
    server_B_thread = threading.Thread(target=server_B.serve_forever)

    server_A_thread.setDaemon(True)
    server_B_thread.setDaemon(True)

    server_A_thread.start()
    server_B_thread.start()

    while 1:
        time.sleep(1)







### This is working with one port, dont delete it to stay safe
# HOST = "authenticator"
# PORT = 6000

# s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# s.bind((HOST, PORT))
# s.listen()
# while(True):
#     conn, addr = s.accept()
#     print(f"Connected by {addr}")

#     signInData = conn.recv(1024)
#     signInData = signInData.decode('utf-8')
#     res = json.loads(signInData)
#     print(signInData)
#     print(res)
#     # print(type(signInData))
#     # print(type(res))
#     flag = checkData(res)
#     if(flag):
#         print("valid")
#         conn.sendall(b"yes")
#     else:
#         print("not valid")
#         conn.sendall(b"no")

    
    
    


