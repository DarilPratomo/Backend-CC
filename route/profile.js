var router = require('express').Router()
var fire = require('../config/dbConfig')
var bodyParser = require('body-parser')
var bycript = require('bcryptjs')
var db = fire.firestore()
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
const Multer = require('multer')
const jwt = require('jsonwebtoken')

// jwt
const secretKey = 'MyLovelyYaeMiko'
function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    console.log(token)
    if(token == null){
        return res.status(401).json({
            error: true,
            message: 'Unauthorized'
        })
    }
    jwt.verify(token, secretKey, (err, user)=>{
        if(err){
            return res.status(403).json({
                error: true,
                message: 'Forbidden'
            })
        }
        req.user = user
        next()
    }
)}


// image upload
const imgUpload = require('../config/imgUpload')

const multer = Multer({
    storage: Multer.MemoryStorage,
    fileSize: 5 * 1024 * 1024
})

// route for get profile by jwt token
router.get('/profile', authenticateToken, (req, res)=>{
    db.collection('users')
    .where('uid', '==', req.user.uid)
    .get()
    .then((doc)=>{
        if(doc.empty){
            console.log('Profile tidak ditemukan')
            return res.status(500).json({
                error: true,
                message: 'Profile tidak ditemukan'
            })
        }
        else{
            const authHeader = req.headers['authorization']
            const token = authHeader && authHeader.split(' ')[1]

            console.log('Profile ditemukan')
            return res.status(200).json({
                error: false,
                message: 'Profile ditemukan',
                data: doc.docs[0].data(),
                token: token
            })
        }
    })
})

// router.get('/profile', (req, res)=>{
//     session = req.session
//     if(session.uid){
//         db.collection('users')
//         .where('uid', '==', session.uid)
//         .get()
//         .then((doc)=>{
//             if(doc.empty){
//                 console.log('Profile tidak ditemukan')
//                 return res.status(500).json({
//                     error: true,
//                     message: 'Profile tidak ditemukan'
//                 })
//             }
//             else{
//                 console.log('Profile ditemukan')
//                 return res.status(200).json({
//                     error: false,
//                     message: 'Profile ditemukan',
//                     data: doc.docs[0].data()
//                 })
//             }
//         })
//     } else {
//         console.log('Profile tidak ditemukan')
//         return res.status(500).json({
//             error: true,
//             message: 'Profile tidak ditemukan'
//         })
//     }
// })

// route for update username by token with validation on duplicate username
router.put('/profile/username', authenticateToken, (req, res)=>{
    var data = req.body
    console.log(data)
    db.collection('users')
    .where('username', '==', data.username)
    .get()
    .then((doc)=>{
        if(doc.empty){
            db.collection('users')
            .where('uid', '==', req.user.uid)
            .get()
            .then((doc)=>{
                if(doc.empty){
                    console.log('Profile tidak ditemukan')
                    return res.status(500).json({
                        error: true,
                        message: 'Profile tidak ditemukan'
                    })
                } else {
                    bycript.compare(data.password, doc.docs[0].data().password, (err, result)=>{
                        if(result){
                            db.collection('users')
                            .doc('/'+doc.docs[0].id+'/')
                            .update({
                                username: data.username
                            })
                            .then(()=>{
                                // update token
                                var token = jwt.sign({
                                    uid: doc.docs[0].data().uid, 
                                    username: data.username, 
                                    email: doc.docs[0].data().email, 
                                    image_url: doc.docs[0].data().image_url
                                }, secretKey)
                                req.user = jwt.verify(token, secretKey)

                                console.log('Username berhasil diupdate')
                                return res.status(200).json({
                                    error: false,
                                    message: 'Username berhasil diupdate',
                                    data: req.user,
                                    token: token
                                })
                            })
                        } else {
                            console.log('Password salah')
                            return res.status(500).json({
                                error: true,
                                message: 'Password salah'
                            })
                        }
                    })
                }
            })
        } else {
            console.log('Username sudah terdaftar')
            return res.status(500).json({
                error: true,
                message: 'Username sudah terdaftar'
            })
        }
    })
})


// router.put('/profile/username', (req, res)=>{
//     session = req.session
//     if(session.uid){
//         var data = req.body
//         console.log(data)
//         db.collection('users')
//         .where('username', '==', data.username)
//         .get()
//         .then((doc)=>{
//             if(doc.empty){
//                 db.collection('users')
//                 .where('uid', '==', session.uid)
//                 .get()
//                 .then((doc)=>{
//                     if(doc.empty){
//                         console.log('Profile tidak ditemukan')
//                         return res.status(500).json({
//                             error: true,
//                             message: 'Profile tidak ditemukan'
//                         })
//                     } else {
//                         bycript.compare(data.password, doc.docs[0].data().password, (err, result)=>{
//                             if(result){
//                                 db.collection('users')
//                                 .doc('/'+doc.docs[0].id+'/')
//                                 .update({
//                                     username: data.username
//                                 })
//                                 .then(()=>{
//                                     req.session.username = data.username
//                                     console.log('Username berhasil diupdate')
//                                     return res.status(200).json({
//                                         error: false,
//                                         message: 'Username berhasil diupdate'
//                                     })
//                                 })
//                             } else {
//                                 console.log('Password salah')
//                                 return res.status(500).json({
//                                     error: true,
//                                     message: 'Password salah'
//                                 })
//                             }
//                         })
//                     }
//                 })
//             } else {
//                 console.log('Username sudah terdaftar')
//                 return res.status(500).json({
//                     error: true,
//                     message: 'Username sudah terdaftar'
//                 })
//             }
//         })
//     } else {
//         console.log('Profile tidak ditemukan')
//         return res.status(500).json({
//             error: true,
//             message: 'Profile tidak ditemukan'
//         })
//     }
// })

// route for update email by token with validation on duplicate email
router.put('/profile/email', authenticateToken, (req, res)=>{
    var data = req.body
    console.log(data)
    db.collection('users')
    .where('email', '==', data.email)
    .get()
    .then((doc)=>{
        if(doc.empty){
            db.collection('users')
            .where('uid', '==', req.user.uid)
            .get()
            .then((doc)=>{
                if(doc.empty){
                    console.log('Profile tidak ditemukan')
                    return res.status(500).json({
                        error: true,
                        message: 'Profile tidak ditemukan'
                    })
                } else {
                    bycript.compare(data.password, doc.docs[0].data().password, (err, result)=>{
                        if(result){
                            db.collection('users')
                            .doc('/'+doc.docs[0].id+'/')
                            .update({
                                email: data.email
                            })
                            .then(()=>{
                                // update token
                                var token = jwt.sign({
                                    uid: doc.docs[0].data().uid, 
                                    username: doc.docs[0].data().username, 
                                    email: data.email, 
                                    image_url: doc.docs[0].data().image_url
                                }, secretKey)
                                req.user = jwt.verify(token, secretKey)

                                console.log('Email berhasil diupdate')
                                return res.status(200).json({
                                    error: false,
                                    message: 'Email berhasil diupdate',
                                    data: req.user,
                                    token: token
                                })
                            })
                        } else {
                            console.log('Password salah')
                            return res.status(500).json({
                                error: true,
                                message: 'Password salah'
                            })
                        }
                    })
                }
            })
        } else {
            console.log('Email sudah terdaftar')
            return res.status(500).json({
                error: true,
                message: 'Email sudah terdaftar'
            })
        }
    })
})

// router.put('/profile/email', (req, res)=>{
//     session = req.session
//     if(session.uid){
//         var data = req.body
//         console.log(data)
//         db.collection('users')
//         .where('email', '==', data.email)
//         .get()
//         .then((doc)=>{
//             if(doc.empty){
//                 db.collection('users')
//                 .where('uid', '==', session.uid)
//                 .get()
//                 .then((doc)=>{
//                     if(doc.empty){
//                         console.log('Profile tidak ditemukan')
//                         return res.status(500).json({
//                             error: true,
//                             message: 'Profile tidak ditemukan'
//                         })
//                     } else {
//                         // password validation
//                         bycript.compare(data.password, doc.docs[0].data().password, (err, result)=>{
//                             if(result){
//                                 db.collection('users')
//                                 .doc('/'+doc.docs[0].id+'/')
//                                 .update({
//                                     email: data.email
//                                 })
//                                 .then(()=>{
//                                     req.session.email = data.email
//                                     console.log('Email berhasil diupdate')
//                                     return res.status(200).json({
//                                         error: false,
//                                         message: 'Email berhasil diupdate'
//                                     })
//                                 })
//                             } else {
//                                 console.log('Password salah')
//                                 return res.status(500).json({
//                                     error: true,
//                                     message: 'Password salah'
//                                 })
//                             }
//                         })
//                     }
//                 })
//             } else {
//                 console.log('Email sudah terdaftar')
//                 return res.status(500).json({
//                     error: true,
//                     message: 'Email sudah terdaftar'
//                 })
//             }
//         })
//     } else {
//         console.log('Profile tidak ditemukan')
//         return res.status(500).json({
//             error: true,
//             message: 'Profile tidak ditemukan'
//         })
//     }
// })

// `route for update password by token with validation on confirmation password
router.put('/profile/password', authenticateToken, (req, res)=>{
    var data = req.body
    console.log(data)
    db.collection('users')
    .where('uid', '==', req.user.uid)
    .get()
    .then((doc)=>{
        if(doc.empty){
            console.log('Profile tidak ditemukan')
            return res.status(500).json({
                error: true,
                message: 'Profile tidak ditemukan'
            })
        } else {
            bycript.compare(data.password, doc.docs[0].data().password, (err, result)=>{
                if(result){
                    if(data.newPassword == data.confirmPassword){
                        bycript.hash(data.newPassword, 10, (err, hash)=>{
                            db.collection('users')
                            .doc('/'+doc.docs[0].id+'/')
                            .update({
                                password: hash
                            })
                            .then(()=>{
                                const authHeader = req.headers['authorization']
                                const token = authHeader && authHeader.split(' ')[1]

                                console.log('Password berhasil diupdate')
                                return res.status(200).json({
                                    error: false,
                                    message: 'Password berhasil diupdate',
                                    data: req.user,
                                    token: token
                                })
                            })
                        })
                    } else {
                        console.log('Password tidak sama')
                        return res.status(500).json({
                            error: true,
                            message: 'Password tidak sama'
                        })
                    }
                } else {
                    console.log('Password salah')
                    return res.status(500).json({
                        error: true,
                        message: 'Password salah'
                    })
                }
            })
        }
    })
})


// router.put('/profile/password', (req, res)=>{
//     session = req.session
//     if(session.uid){
//         var data = req.body
//         console.log(data)
//         db.collection('users')
//         .where('uid', '==', session.uid)
//         .get()
//         .then((doc)=>{
//             if(doc.empty){
//                 console.log('Profile tidak ditemukan')
//                 return res.status(500).json({
//                     error: true,
//                     message: 'Profile tidak ditemukan'
//                 })
//             } else {
//                 bycript.compare(data.password, doc.docs[0].data().password, (err, result)=>{
//                     if(result){
//                         if(data.newPassword == data.confirmPassword){
//                             bycript.hash(data.newPassword, 10, (err, hash)=>{
//                                 db.collection('users')
//                                 .doc('/'+doc.docs[0].id+'/')
//                                 .update({
//                                     password: hash
//                                 })
//                                 .then(()=>{
//                                     console.log('Password berhasil diupdate')
//                                     return res.status(200).json({
//                                         error: false,
//                                         message: 'Password berhasil diupdate'
//                                     })
//                                 })
//                             })
//                         } else {
//                             console.log('Password tidak sama')
//                             return res.status(500).json({
//                                 error: true,
//                                 message: 'Password tidak sama'
//                             })
//                         }
//                     } else {
//                         console.log('Password salah')
//                         return res.status(500).json({
//                             error: true,
//                             message: 'Password salah'
//                         })
//                     }
//                 })
//             }
//         })
//     } else {
//         console.log('Profile tidak ditemukan')
//         return res.status(500).json({
//             error: true,
//             message: 'Profile tidak ditemukan'
//         })
//     }
// })

// route for delete profile by token than delete token
router.delete('/profile', authenticateToken, (req, res)=>{
    db.collection('users')
    .where('uid', '==', req.user.uid)
    .get()
    .then((doc)=>{
        if(doc.empty){
            console.log('Profile tidak ditemukan')
            return res.status(500).json({
                error: true,
                message: 'Profile tidak ditemukan'
            })
        } else {
            bycript.compare(req.body.password, doc.docs[0].data().password, (err, result)=>{
                if(result){
                    db.collection('users')
                    .doc('/'+doc.docs[0].id+'/')
                    .delete()
                    .then(()=>{
                        // delete token
                        req.user = null
                        console.log('Profile berhasil dihapus')
                        return res.status(200).json({
                            error: false,
                            message: 'Profile berhasil dihapus'
                        })
                    })
                } else {
                    console.log('Password salah')
                    return res.status(500).json({
                        error: true,
                        message: 'Password salah'
                    })
                }
            })
        }
    })
})


// router.delete('/profile', (req, res)=>{
//     session = req.session
//     var data = req.body
//     if(session.uid){
//         db.collection('users')
//         .where('uid', '==', session.uid)
//         .get()
//         .then((doc)=>{
//             if(doc.empty){
//                 console.log('Profile tidak ditemukan')
//                 return res.status(500).json({
//                     error: true,
//                     message: 'Profile tidak ditemukan'
//                 })
//             } else {
//                 // password validation
//                 bycript.compare(data.password, doc.docs[0].data().password, (err, result)=>{
//                     if(result){
//                         db.collection('users')
//                         .doc('/'+doc.docs[0].id+'/')
//                         .delete()
//                         .then(()=>{
//                             req.session.destroy()
//                             console.log('Profile berhasil dihapus')
//                             return res.status(200).json({
//                                 error: false,
//                                 message: 'Profile berhasil dihapus'
//                             })
//                         })
//                     } else {
//                         console.log('Password salah')
//                         return res.status(500).json({
//                             error: true,
//                             message: 'Password salah'
//                         })
//                     }
//                 })
//             }
//         })
//     } else {
//         console.log('Profile tidak ditemukan')
//         return res.status(500).json({
//             error: true,
//             message: 'Profile tidak ditemukan'
//         })
//     }
// })

// // route for update profile by session with validation on duplicate username and email and confirmation password
// router.put('/profile', (req, res)=>{
//     session = req.session
//     if(session.username){
//         var data = req.body
//         db.collection('users')
//         .doc('/'+session.username+'/')
//         .get()
//         .then((doc)=>{
//             if(doc.exists){
//                 bycript.compare(data.password, doc.data().password, (err, result)=>{
//                     if(result){
//                         db.collection('users')
//                         .where('username', '==', data.username)
//                         .get()
//                         .then((doc)=>{
//                             if(doc.empty){
//                                 db.collection('users')
//                                 .where('email', '==', data.email)
//                                 .get()
//                                 .then((doc)=>{
//                                     if(doc.empty){
//                                         db.collection('users')
//                                         .doc('/'+session.username+'/')
//                                         .update({
//                                             username: data.username,
//                                             email: data.email
//                                         })
//                                         .then(()=>{
//                                             console.log('Profile berhasil diupdate')
//                                             return res.status(200).json({
//                                                 error: false,
//                                                 message: 'Profile berhasil diupdate'
//                                             })
//                                         })
//                                     } else {
//                                         console.log('Email sudah terdaftar')
//                                         return res.status(500).json({
//                                             error: true,
//                                             message: 'Email sudah terdaftar'
//                                         })
//                                     }
//                                 })
//                             } else {
//                                 console.log('Username sudah terdaftar')
//                                 return res.status(500).json({
//                                     error: true,
//                                     message: 'Username sudah terdaftar'
//                                 })
//                             }
//                         })
//                     } else {
//                         console.log('Password salah')
//                         return res.status(500).json({
//                             error: true,
//                             message: 'Password salah'
//                         })
//                     }
//                 })
//             } else {
//                 console.log('Profile tidak ditemukan')
//                 return res.status(500).json({
//                     error: true,
//                     message: 'Profile tidak ditemukan'
//                 })
//             }
//         })
//     } else {
//         console.log('Profile tidak ditemukan')
//         return res.status(500).json({
//             error: true,
//             message: 'Profile tidak ditemukan'
//         })
//     }
// })

// route for update profile photo by token
router.put('/profile/photo', authenticateToken, multer.single('photo'), imgUpload.uploadToGcs, (req, res)=>{
    // console.log(req.file)
    if(req.file && req.file.cloudStoragePublicUrl){
        db.collection('users')
        .where('uid', '==', req.user.uid)
        .get()
        .then((doc)=>{
            if(doc.empty){
                console.log('Profile tidak ditemukan')
                return res.status(500).json({
                    error: true,
                    message: 'Profile tidak ditemukan'
                })
            } else {
                db.collection('users')
                .doc('/'+doc.docs[0].id+'/')
                .update({
                    image_url: req.file.cloudStoragePublicUrl
                })
                .then(()=>{
                    // update token
                    var token = jwt.sign({
                        uid: doc.docs[0].data().uid, 
                        username: doc.docs[0].data().username, 
                        email: doc.docs[0].data().email, 
                        image_url: req.file.cloudStoragePublicUrl
                    }, secretKey)
                    req.user = jwt.verify(token, secretKey)

                    console.log('Photo profile berhasil diupdate')
                    return res.status(200).json({
                        error: false,
                        message: 'Photo profile berhasil diupdate',
                        data: req.user,
                        token: token
                    })
                })
            }
        })
    } else {
        console.log('Photo profile tidak ditemukan')
        return res.status(500).json({
            error: true,
            message: 'Photo profile tidak ditemukan'
        })
    }
})

// router.put('/profile/photo', multer.single('photo'), imgUpload.uploadToGcs, (req, res)=>{
//     session = req.session
//     // console.log(req.file)
//     if(session.uid){
//         if(req.file && req.file.cloudStoragePublicUrl){
//             db.collection('users')
//             .where('uid', '==', session.uid)
//             .get()
//             .then((doc)=>{
//                 if(doc.empty){
//                     console.log('Profile tidak ditemukan')
//                     return res.status(500).json({
//                         error: true,
//                         message: 'Profile tidak ditemukan'
//                     })
//                 } else {
//                     db.collection('users')
//                     .doc('/'+doc.docs[0].id+'/')
//                     .update({
//                         image_url: req.file.cloudStoragePublicUrl
//                     })
//                     .then(()=>{
//                         req.session.image_url = req.file.cloudStoragePublicUrl
//                         console.log('Photo profile berhasil diupdate')
//                         return res.status(200).json({
//                             error: false,
//                             message: 'Photo profile berhasil diupdate'
//                         })
//                     })
//                 }
//             })
//         } else {
//             console.log('Photo profile tidak ditemukan')
//             return res.status(500).json({
//                 error: true,
//                 message: 'Photo profile tidak ditemukan'
//             })
//         }
//     } else {
//         console.log('Profile tidak ditemukan')
//         return res.status(500).json({
//             error: true,
//             message: 'Profile tidak ditemukan'
//         })
//     }
// })

// route for delete profile photo by token
router.delete('/profile/photo', authenticateToken, (req, res)=>{
    db.collection('users')
    .where('uid', '==', req.user.uid)
    .get()
    .then((doc)=>{
        if(doc.empty){
            console.log('Profile tidak ditemukan')
            return res.status(500).json({
                error: true,
                message: 'Profile tidak ditemukan'
            })
        } else {
            db.collection('users')
            .doc('/'+doc.docs[0].id+'/')
            .update({
                image_url: 'https://storage.googleapis.com/capstone-bangkit-bucket/Photo-Profile/dummy_photo_profile.png'
            })
            .then(()=>{
                imgUpload.deleteFromGcs(req.user.image_url.split('/').pop())
                req.user.image_url = 'https://storage.googleapis.com/capstone-bangkit-bucket/Photo-Profile/dummy_photo_profile.png'
                
                // update token
                var token = jwt.sign({
                    uid: doc.docs[0].data().uid, 
                    username: doc.docs[0].data().username, 
                    email: doc.docs[0].data().email, 
                    image_url: req.user.image_url
                }, secretKey)
                req.user = jwt.verify(token, secretKey)

                console.log('Photo profile berhasil dihapus')
                return res.status(200).json({
                    error: false,
                    message: 'Photo profile berhasil dihapus',
                    data: req.user,
                    token: token
                })
            })
        }
    })
})

// router.delete('/profile/photo', (req, res)=>{
//     session = req.session
//     if(session.uid){
//         db.collection('users')
//         .where('uid', '==', session.uid)
//         .get()
//         .then((doc)=>{
//             if(doc.empty){
//                 console.log('Profile tidak ditemukan')
//                 return res.status(500).json({
//                     error: true,
//                     message: 'Profile tidak ditemukan'
//                 })
//             } else {
//                 db.collection('users')
//                 .doc('/'+doc.docs[0].id+'/')
//                 .update({
//                     image_url: 'https://storage.googleapis.com/capstone-bangkit-bucket/Photo-Profile/dummy_photo_profile.png'
//                 })
//                 .then(()=>{
//                     imgUpload.deleteFromGcs(req.session.image_url.split('/').pop())
//                     req.session.image_url = 'https://storage.googleapis.com/capstone-bangkit-bucket/Photo-Profile/dummy_photo_profile.png'
                    
//                     console.log('Photo profile berhasil dihapus')
//                     return res.status(200).json({
//                         error: false,
//                         message: 'Photo profile berhasil dihapus'
//                     })
//                 })
//             }
//         })
//     } else {
//         console.log('Profile tidak ditemukan')
//         return res.status(500).json({
//             error: true,
//             message: 'Profile tidak ditemukan'
//         })
//     }
// })

// export module
module.exports = router;