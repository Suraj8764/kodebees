import express from 'express';
import { activateUser, loginUser, logoutUser, registrationUser, updateAcessToken } from '../controller/usercontroller';
import { IsAuthenticated } from '../middleware/auth';

const Userrouter=express.Router();
Userrouter.post('/registration',registrationUser)
Userrouter.post('/activate-user',activateUser)
Userrouter.post('/login',loginUser)
Userrouter.get('/logout',IsAuthenticated,logoutUser)
Userrouter.get('/refresh',updateAcessToken)

export default Userrouter;