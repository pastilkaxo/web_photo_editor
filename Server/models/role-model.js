const {Schema, model} = require('mongoose')

const RoleSchema = new Schema({
    roleName: {type: String, required: true,default: 'USER', unique:true},
})

module.exports = model('Role', RoleSchema)