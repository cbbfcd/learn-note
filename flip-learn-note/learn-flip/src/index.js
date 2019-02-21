import WAAP from './built-in/waap'
import RAF from './built-in/raf'
import Flip from './flip'

// built-in extensions
Flip.extends('WAAP', WAAP)
Flip.extends('RAF', RAF)

export default Flip