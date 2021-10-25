const mongo = require('mongodb').MongoClient;
const serverPort = 4000;
const client = require('socket.io')(serverPort, {
    cors: {
        origin: 'http://localhost:8000',
        methods: ["GET", "PUT", "POST", "DELETE"],
        allowedHeaders: [
            "Access-Control-Allow-Headers",
            "X-Requested-With",
            "X-Access-Token",
            "Content-Type",
            "Host",
            "Accept",
            "Connection",
            "Cache-Control",
        ],
        credentials: true,
        optionSeccessStatus: 200,
    }
});



// Connect to mongo
mongo.connect('mongodb://I-khan:root@chatapplication-shard-00-00.ylpfc.mongodb.net:27017,chatapplication-shard-00-01.ylpfc.mongodb.net:27017,chatapplication-shard-00-02.ylpfc.mongodb.net:27017/Mongochat?ssl=true&replicaSet=atlas-eikf7l-shard-0&authSource=admin&retryWrites=true&w=majority', function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    // Connect to Socket.io
    client.on('connection', function(socket){
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if(name == '' || message == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                    chat.insert({name: name, message: message}, function(){
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear  
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});