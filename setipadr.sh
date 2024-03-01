if [ -f ./Back-end/.env ]
then
    sed -i "s/localhost/$(hostname -i)/g" './Back-end/.env'
else
    echo "./Back-end/.env is missing, can't replace ip address"
fi
if [ -f ./Front-end/src/config.ts ]
then
    sed -i "s/localhost/$(hostname -i)/g" './Front-end/src/config.ts'
else
    echo "./Front-end/src/config.ts is missing, can't replace ip address"
fi
echo "My ip address is : $(hostname -i)"