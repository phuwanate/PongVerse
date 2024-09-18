FROM python:3

COPY tools .

COPY app /usr/src/app/

RUN pip install -r requirements.txt

RUN chmod +x django_entrypoint.sh

WORKDIR /usr/src/app

EXPOSE 8000

ENTRYPOINT [ "/django_entrypoint.sh" ]

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]