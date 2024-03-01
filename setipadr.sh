sed -i "s/localhost/$(hostname -i)/g" './Back-end/.env'
sed -i "s/localhost/$(hostname -i)/g" './Front-end/src/config.ts'
