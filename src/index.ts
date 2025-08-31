import * as express from 'express';
import * as bcrypt from 'bcrypt';
import * as cors from 'cors';
import {db, rtdb} from './db';
import * as jwt from 'jsonwebtoken';
//import { nanoid } from "nanoid";

const app = express();
const port = 3000
app.use(cors());
app.use(express.json());

// Simulación de base de datos de salas de chat
const chatRooms = [
  { id: 'dogs', title: '🐶 Dogs 🐶' },
  { id: 'food', title: '🍔 Food 🍔' },
  { id: 'general', title: '💬 General 💬' },
  { id: 'news', title: '🗞 News 🗞' },
  { id: 'music', title: '🎹 Music 🎹' },
  { id: 'sports', title: '🏈 Sports 🏈' },
];

app.get('/', (req, res) => {
  res.send('Bienvenid@ a la app!')
})


//POST
app.post('/users', async (req, res) => {
  const {username, password, email} = req.body;

  if(!username || !password){
    return res.status(400).send({mesagess: 'Se requiere nombre de usuario y password'});
  }
    try{
        // Generar un hash de la contraseña de forma asíncrona
        const hasheoPasword = await bcrypt.hash(password, 10);
        const userToSave = {
            username,
            password: hasheoPasword,
            email
        }
      const docRef = await db.collection('users').add(userToSave);
      const usuario = {id: (await docRef).id, ...userToSave }
        res.status(201).send({messages: 'Usuario creado correctamente!', usuario});
        console.log("bien creaste un nuevo usuario")
    }catch(error){
        res.status(500).send({messages: 'error al crear el usuario', error: error.mesagess});
    }
})

//POST/LOGIN
app.post('/login', async (req, res) => {
  const {username, password} = req.body;

  //buscar usuario en la base de datos
  const user = await db.collection('users').where('username', '==', username).get();

  if(!user){
    return res.status(400).send({mesagess: 'Usuario no encontrado'});
  }
    const userData = user.docs[0].data();

    //comparamos password
    const match = await bcrypt.compare(password, userData.password);
    if(!match){
        return res.status(401).send({messages: "password incorrecto"})
    }

    //genera token
    const token = jwt.sign({ id: userData.id }, '1234567', { expiresIn: '1h' });
  res.send({ token });
})

// Función para obtener la sala de chat por ID
const getChatRoomById = (roomId) => {
  return chatRooms.find(room => room.id === roomId);
};


//ingresamos a la sala de chat
app.get('/chat/:roomId', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extraer el token

  console.log('tu token');

  if (!token) {
    return res.status(403).send({ message: 'Token no proporcionado' });
  }

  jwt.verify(token, '1234567', (err, decoded) => {
    if (err) {
       console.log("Error de verificación de token:", err); // Log del error
    return res.status(401).send({ message: 'Token inválido' });
    }

    // Aquí puedes buscar la sala de chat usando roomId
    const roomId = req.params.roomId;
    // Supongamos que tenés una función para obtener la sala
    const chatRoom = getChatRoomById(roomId); // Implementa esta función según tu lógica

    if (!chatRoom) {
      return res.status(404).send({ message: 'Sala no encontrada' });
    }

    res.send({ message: 'Acceso a la sala de chat', chatRoom });
  });
});

//envio de mensajes
// Simulación de base de datos de mensajes
const chatMessages = {
  dogs: [],
  food: [],
  general: [],
  news: [],
  music: [],
  sports: [],
};

// Obtener mensajes de la sala
app.get('/chat/:roomId/messages', (req, res) => {
  const roomId = req.params.roomId;
  res.send({ messages: chatMessages[roomId] || [] });
});

// Enviar un mensaje a la sala
app.post('/chat/:roomId/messages', (req, res) => {
  console.log('POST recibido en /chat/:roomId/messages');
  const roomId = req.params.roomId;
  const newMessage = req.body;

  if (!chatMessages[roomId]) {
    chatMessages[roomId] = [];
  }

  chatMessages[roomId].push(newMessage); // Agregar el nuevo mensaje a la sala
  res.status(201).send(newMessage); // Devolver el mensaje creado
});

//GET ID
app.get('/users/:id', async (req, res) => {
    try{
        const docRef = db.collection('users').doc(req.params.id);//Buscamos producto por su id
        const doc = await docRef.get();
        if(!doc){
            return res.status(400).send({messages: 'Usuario no encontrado'})
        }
        const usuario = {id: doc.id, ...doc.data()}
        res.status(200).send(usuario);
    }catch(error){
        res.status(500).send({messages: 'Error al obtener usuario', error});
    }
})

//PUT
app.put('/users/:id', async (req, res) =>{
    try{
        const docRef = db.collection('users').doc(req.params.id); //buscamos el id del producto
        docRef.update(req.body);

        const updateDoc = await docRef.get();
        const userActualizado = {id: (await updateDoc).id, ...(await updateDoc).data()}

        if(!userActualizado){
            return res.status(404).send({messages: 'Usuario no encontrado'})
            }

            res.status(200).send({messages: 'Se actualizo el usuario!', userActualizado});
    }catch(error){
        res.status(500).send({messages: 'Error al actualizar el usuario!'})
    }
})


//DELETE
app.delete('/users/:id', async (req, res)=>{
    try{
        const docRef = db.collection('users').doc(req.params.id);
        const doc = docRef.get();

        if(!(await doc).exists){
            return res.status(400).send({messages: 'Usuario no encontrado'})
        }
        docRef.delete();
        res.status(200).send({messages: 'Usuario eliminado correctamente'})
    }catch(error){
        res.status(500).send({messages: 'Error al intentar eliminar', error})
    }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})