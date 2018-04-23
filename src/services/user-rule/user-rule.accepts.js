import fp from 'mostly-func';
import { helpers } from 'mostly-feathers-validate';

export default function accepts (context) {
  // validation rules
  const user = { arg: 'user', type: 'string', required: true, description: 'Current user' };
  
  return {
    create: [ user ]
  };
}
