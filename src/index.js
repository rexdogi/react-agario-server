import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import config from './config.json';
import SocketIO from 'socket.io';

let ball = (x, y, radius, isPlayer = false, clientId = "") => {
    return {
        isPlayer: isPlayer,
        id: clientId,
        x: x,
        y: y,
        dx: 0,
        dy: 0,
        radius: radius,
        color: 'blue',
    };
}

let randomIntFromInterval = (min,max) => {
    return Math.floor(Math.random()*(max-min+1)+min);
}

let objects = [ball(randomIntFromInterval(300, 11000 - 300), randomIntFromInterval(300, 11000 - 300), 30)];

let app = express();
app.server = http.createServer(app);
let io = new SocketIO(app.server);

// logger
app.use(morgan('dev'));

// 3rd party middleware
app.use(cors({
	exposedHeaders: config.corsHeaders
}));

app.use(bodyParser.json({
	limit : config.bodyLimit
}));

app.server.listen(process.env.PORT || config.port);
console.log(`Started on port ${app.server.address().port}`);

io.on('connection', function (socket) {
	console.log('connected');

    socket.on('update', (data) => {
        objects = objects.map((item) => {
            if(item != null && item.id === data.id) {
                return {...item, dx: data.x, dy: data.y}
            } else {
                return item;
            }
        })
    })
	objects.push(ball(randomIntFromInterval(300, 11000 - 300), randomIntFromInterval(300, 11000 - 300),40, true, socket.id))
});

let increaseRadius = (id, radius) => {
    objects = objects.map((item) => {
        if(item.id === id) {
            return {...item, radius: item.radius + radius}
        } else {
            return item;
        }
    })
}

let checkCollision = (item) => {
    setTimeout(() => {
      objects.map((obj) => {
          if(obj !== null && obj.id !== item.id) {
              if ((Math.pow(item.x - obj.x, 2) + Math.pow(item.y - obj.y, 2)) < (item.radius * item.radius)) {
                  let index = objects.indexOf(obj);
                  if(index !== -1 ) {
                      increaseRadius(item.id, 5);
                      objects.splice(index, 1);
                  }
              }
          }
      })
    },0)
}


setInterval(() => {
    objects = objects.map((item => {
        if(item !== null && item.isPlayer === true) {
            checkCollision(item);
        }
        if(item !== null && item.isPlayer === true) {
            return {...item, x: item.x + item.dx, y: item.y + item.dy}
        } else {
            return item;
        }
    }))
    io.emit('update', objects);
}, 1000/64);


setInterval(() => {
    objects.push(ball(randomIntFromInterval(300, 11000 - 300), randomIntFromInterval(300, 11000 - 300),15))
}, 50);



export default app;
