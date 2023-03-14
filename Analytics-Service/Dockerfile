FROM python

WORKDIR /app

RUN pip install mysql-connector-python
RUN pip install pymongo


COPY . .

EXPOSE 3001

CMD [ "python3", "script.py" ]
