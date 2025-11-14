import bcrypt from 'bcryptjs';

const plain = 'mypassword123'; 
const hash = '$2b$10$SDtzCiFVcomiatVSJgfj.eeDXduUdIhcBXd0hm5IN1metuo1rjkPq';

bcrypt.compare(plain, hash).then(match => {
  console.log('Password match?', match);
});
