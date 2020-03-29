const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generatedMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)  // express do this behind the scene 
const io = socketio(server)

app.use(express.json())

const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

// 'connection' and 'disconnect' are the build in event 
io.on('connection',(socket)=>{
    console.log('New WebSocket connection')


    socket.on('sendLocation', (coords, callback)=> {

        const {username, room} = getUser(socket.id)
        
        const url = `http://google.com/maps?q=${coords.latitude},${coords.longitude}`
        
        io.to(room).emit('locationMessage', generateLocationMessage(username, url))
        callback()      
    })

    socket.on('join', (options, callback) => { 
        const { error, user } = addUser({ id: socket.id, ...options }) // socket.id is unqiue for every socket connection

        if (error) {
           return callback(error)
        }

        socket.join(user.room) 

        socket.emit('message', generatedMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generatedMessage(`${user.username} has joined!`)) 

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback() // acknowledge function call for successful connection
    })

    socket.on('clientMsg', (clientMsg, callback) => {

        const {username, room} = getUser(socket.id)

        const filter = new Filter()

        if(filter.isProfane(clientMsg)){
            return callback('Profanity is not allowed')
        }

        io.to(room).emit('message', generatedMessage(username, clientMsg) )
        callback()   // calling the acknowledgement function
    })

    socket.on('disconnect', () => {
        const exitingUser = removeUser(socket.id)

        if(exitingUser){
            io.to(exitingUser.room).emit('message', generatedMessage('Admin',`${exitingUser.username} has left!`))

            io.to(exitingUser.room).emit('roomData', {
                room: exitingUser.room,
                users: getUsersInRoom(exitingUser.room)
            })
        }

        
    })
})

server.listen(port, ()=>{
    console.log('Server is up on port' + port)
})