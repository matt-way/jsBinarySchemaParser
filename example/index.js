import GIFSchema from './gif-schema'
import fs from 'fs'
import { parse } from '../src'

const data = fs.readFileSync('./example/test.gif')
const result = parse(data, GIFSchema)
console.log(result)
