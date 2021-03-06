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
- Structs are created by passing a hash to the `struct` function
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

; Struct
; note that keyword keys will be converted to string keys
(define my-struct (struct { :a "hi" :b "bonjour" })) ;-> { struct: a => "hi" b => "bonjour" }

; Update a struct with a :with expression
; Structs are immutable, so this creates a new struct with the updated values
{my-struct :with :c "hola"} ;-> { struct: a => "hi" b => "bonjour" c => "hola" }

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

; Handle exceptions with a try/catch block
(try fn-that-may-throw (catch ex (handle ex)))

; If you need to throw an exception you can use fail
(fail "whoops, my bad")

; Or if you need a different error type use one of the exn functions
(throw (exn:runtime "Mistakes were made"))
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

## Object-oriented programming

Even though Lisps are known more for functional programming, there is a long history of OOP in Lisp languages. Daniel is a fully object-oriented language with classes and inheritance.

```lisp
; Creating a class
(class Person
    (new :name :age)) ; The new form creates instance variables in the order the args need to be given to the constructor

; Instantiating a class
(define jason (Person "Jason" 41))

; You can also instantiate a class by passing a hash to the constructor
(define jason (Person {:name "Jason" :age 41}))

; Use the define form within a class to set a class variable
; Also, the init method is called on the instance after it is instantiated with arguments
; The init method only takes this as an argument and returns this when it is done
(class Person
    (define people 0)
    (new :name :age)
    (init (this)
        (.people Person (+ (.people Person) 1))))

; You can create public methods
(class Person
    (new :name :age)
    (greet (this other-name)
        (string-append "Hello " other-name))
    (work (this job)
        (string-append (.name this) " works at " job)))

; Use the :private keyword to define a private method
; Private methods are only visible from inside the class; they can't be called by outside code
(class Account
    (new :balance)
    ; public method
    (withdraw (this amount) (if (can-withdraw? this amount)
                                (begin
                                    (.balance this (- (.balance this) 1))
                                    (.balance this))
                                ("Sorry, your balance is insufficient")))
    ; private method
    (can-withdraw? :private (this amount) (> (.balance this) amount)))

; Use the :static keyword to define a static method
; Static methods are defined on the class itself, not on an instance of the class
(class Utils
    (add :static (this a b) (+ a b)))

; Access properties as call expressions with a dot at the beginning
(.name jason) ; get
(.name jason "Jason Barr") ; set
(.greet jason "Robert") ; method call

; Use the :extends keyword for inheritance
(class Programmer :extends Person
    (new :languages)
    (do-code (this lang-index)
        ; super argument accesses superclass methods
        (.work super (string-append "programming " (get lang-index (.languages this))))))

; Like with structs, a class constructor can also take a map as an argument
(define josh (Person { :name "Joshua" :age 32 }))

; If you need to define a custom error type, extend the exn class
; and provide the message parameter when constructing an instance
(class RidiculousMistake :extends exn
    (new :reason)
    (init (this) (.message this (string-append (.message super) (.reason this)))))
```

## Macros

Daniel has a robust macro facility that allows you to add new syntactic forms to the language.

```lisp
; Quoting:
; You can quote data with either the quote function or '
; Quoting a literal evaluates to the literal itself.
; Quoting an identifier evaluates to the symbol of the identifier, as data
'hi ;-> Symbol(hi)
'"hi" ;-> "hi"

; 'hi is the same as
(quote hi)

; Quasiquoting allows you to unquote symbols for evaluation
(define x 5)
`(+ y ~x) ;-> ('+ 'y 5)

; is the same as
(quasiquote (+ y (unquote x)))

; The splice-unquote form splices an evaluated list into a quoted list
`(a b ~@[c d e] f g) ;-> `(a b ~c ~d ~e f g)

; Use the eval form to resolve quoted symbols to their values in the current scope
(define x 5)
(eval '(+ x 1)) ;-> (+ 5 1) -> 6

; This ability to delay or prevent evaluation helps you to define new syntactic forms with defmacro
; This macro definition is actually in the core module
(defmacro unless (a b) `(if ~a ~b ~a))
```
