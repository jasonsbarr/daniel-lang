# Daniel Language Documentation

Daniel is an educational language, but it is also a fully-featured programming language capable of running a wide range of programs.

## Data types

Daniel uses the underlying native (JavaScript) data types under the hood:

- Number
- String
- Boolean
- Null/Undefined (as nil)
- Symbol (as keywords)
- Array (as lists)
- Map (as hashes)
- Object (as structs)

## Literals

- Number literals can be written in integer or floating point form. No hexadecimal/binary/octal notation or exponential form.
- String literals are double-quoted, single-line only. There are currently no multi-line or interpolated strings.
- Booleans are written as `#true` and `#false`.
- Nil/empty list is written as `nil`.
- Keywords are identifiers prefixed with a colon
  - e.g. `:hello`
- List literals are written with square brackets and no commas
  - e.g. `[1 2 3 4 5]`
- Hash literals are written as key/value pairs with curly braces and no commas
  - e.g. `{:a "hello" :b "bonjour"}`
  - You can use any hashable value as hash keys, but strings and keywords are the most common
- Identifiers can start with any Unicode letter, plus the characters :=<>%:|?\/\*.\_$!+-, and after that may also include any Unicode number and @~^&#'.
- Comments start with ;. There are no multi-line comments.

## Expressions

All literals are expressions that evaluate to themselves.

Identifiers must resolve to a bound value in either the current or one of its enclosing environments.

Call expressions and special forms are surrounded by parentheses.

```lisp
; Call expression
; Applies a function to arguments
(function-name-or-expression arg1 arg2 ...)

; If expression
; Evaluates to one of two values based on its condition's truthiness or falsiness
; Note that only `#false` and `nil` values are falsy, unlike in JavaScript
(if condition then-expr else-expr)

; Lambda expression
; Creates an anonymous (unbound) function
(lambda (arg1 arg2 ...) body-expr)

; Block expression
; Can contain more than one expression in series
; Returns the value of the last expression
(begin
    expr1
    expr2
    ...)

; Define
; Creates a top-level binding in the current environment

; Defining a value
(define greeting "Hello")

; Defining a function
(define (greet name) (string-append "Hello " name))

; Setting a value after it has been defined
(set! greeting "Hi")

; Let expression (local binding)
; Binds values to names for use in the following expression
(let
    ((id value)
    (id value))
    body-expr)

; For
; Iterates over a sequence and performs an action on each item in the sequence
; Generally used for processing side effects, but can also be used to reduce a sequence
; Returns the value of the body expression from the final iteration
(for ((i [a b c]))
    body)

; Can have an optional keyword :when or :unless clause
; :when executes the body only when the following expression is truthy
; :unless executes the body only when the following expression is falsy
(for ((i [1 2 3 4]) :unless (even? i))
    (println i))

; For/list (list comprehension)
; Same as a for expression, except it collects the results of the body into a list
(for/list ((i [1 2 3 4 5]))
    (* i i))

; For/list can also take a :when or :unless clause
(define (reject fn lst)
    (for/list ((n lst) :unless (fn n)) n))
```

## Modules, exports, and imports

```lisp
; Define a module with `module-begin`
; Note that the interpreter will assume each module is contained in its
; own file that has the same name as the module. `module-begin`
; Should be followed by the string name of the module
; Exports are defined with `provide`
(module-begin "identity"
(define (id x) x)

    (provide id))

; Consume a module with either `import` or `open`. `open`
; imports all the functions into the current environment
; without namespacing, so later imports will overwrite
; previous ones if you're not careful.
(open "identity")

; `import` namespaces the module's functions
(import "identity")

; Note that the dot is just part of the identifier, this
; is not an object and property like in JavaScript
(identity.id x)

; Use an :as clause to rename the module in case of multiple
; modules that may have the same name
(import "identity" :as "id")
(id.id x)

```

```

```
