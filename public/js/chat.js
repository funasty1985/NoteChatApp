const socket = io()

// Elements 
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('#submitButton')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#message')
const $siderbar = document.querySelector('#sidebar') 

// Template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#siderbar-Template').innerHTML
// Option
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })  //location.search is a build-in variable in broswer

const autoscroll = () => {
    // New message element 
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visiable Height , it is the sum of each messages height 
    // until the sum reaches the visiable height of the element 
    // in the broswer, by then, it is the visiable height of that 
    // element
    const VisiableHeight = $messages.offsetHeight

    // Height of messages container (content)
    const containerHeight = $messages.scrollHeight

    // $messages.scrollTop : the amount of distance the between the top and the top of the scroll bar 
    // if we don't scroll , scrollOfffset = VisiableHeight(that is the visiable height of element 'message')
    // if there are room to scroll (ie containerHeight > VisiableHeight) 
    // and we scroll,
    // scrollOfffset = $messages.scrollTop + VisiableHeight (ie how far do we scroll)
    const scrollOfffset = $messages.scrollTop + VisiableHeight
    console.log(scrollOfffset)
    // containerHeight - newMessageHeight is Height of the messages content excluding the latest message
    // by expression, we want to make sure we are at the bottom before the new message is added
    // and autoscroll we only take place it this situation
    if (containerHeight - newMessageHeight <= scrollOfffset) {
        // other than reaing the value of scrollTop top like above ,
        // we can assign value to it.
        $messages.scrollTop = $messages.scrollHeight
    }




}

socket.on('message', (msg) => {
    console.log(msg)
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createAt: moment(message.createAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', ({username, url, createAt})=>{
    console.log(createAt)
    const html = Mustache.render(locationTemplate, {
        username,
        url,
        createAt: moment(message.createAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users})=> {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    $siderbar.innerHTML = html
})



$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault() // prevent the submit of html form to reload the page
  
    $messageFormButton.setAttribute('disabled','disabled')

    // disable send button
    const clientMsg = e.target.elements.message.value
    
    socket.emit('clientMsg', clientMsg, (error) => {  // defining an acknowledgements function
        // enable send button
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {                                    
            return console.log(error)
        }
        
        console.log('The message was delivered')  
    })
})

$sendLocationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Geolacation is not support by your browser')
    }
    
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((Position) => {

        $sendLocationButton.removeAttribute('disabled')
    
        socket.emit('sendLocation', {
            latitude: Position.coords.latitude,
            longitude: Position.coords.longitude
        }, () => {
            console.log('Location is shared')
        })
    })
})

socket.emit('join', { username,  room}, (error) => {
    if (error){
        alert(error)
        location.href = '/'
    }
})