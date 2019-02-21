import WAAP from './built-in/waap'
import RAF from './built-in/raf'
import CSS from './built-in/css'
import Flip from './flip'

// built-in extensions
Flip.extends('WAAP', WAAP)
Flip.extends('RAF', RAF)
Flip.extends('CSS', CSS)

export default Flip