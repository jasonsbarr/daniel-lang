# Daniel Programming Language

A Lisp-like programming language for learning about programming languages, implemented in JavaScript

## Inspiration

This language is inspired by the classic language Scheme as well as the modern Lisp languages Racket and Clojure.

The language is named after two people (not necessarily in the following order):

1. Daniel P. Friedman, who literally wrote (one of) the book(s) on programming languages
2. My beloved son, Daniel, who finds new ways to bring joy into my life every single day

## Educational purpose

This language is primarily for educational purposes, both for me to learn more about language implementation and also for others who are interested in programming languages but may not have the opportunity to study them formally at an institution of higher learning.

And, of course, if a computer science student at a university DID find this repo useful, that would totally be fine too!

When I say "educational purposes," I mean the language is for learning about language design and implementation, not primarily for production use in web or offline applications. That means the implementation should favor clarity and ease of reading the code over things like efficiency, though hopefully it will be _reasonably_ efficient as well&ndash;it's hard to learn about a language if it takes 30 seconds to run even small programs, after all!

## The structure of this repo

Starting out, I will create different branches for different stages of the implementation. I will release videos and possibly also articles to go with each of these branches to aid in understanding what I'm doing and why I'm doing it. For example, there will be branches on lexical analysis, parsing, building the interpreter, and other relevant topics. Later on, as I get into more difficult topics, I may have to pursue a different strategy with branching because I'll be doing a fair bit of trial and error and hacking things together as the language gets beyond my current level of understanding.

## Branches that show the stages of development

- [01 - Tokenizer](https://github.com/jasonsbarr/daniel-lang/tree/01-tokenizer)
- [02 - Reader](https://github.com/jasonsbarr/daniel-lang/tree/02-reader)
- [03 - Eval and call expressions](https://github.com/jasonsbarr/daniel-lang/tree/03-eval)
- [04 - Modules and the module loader](https://github.com/jasonsbarr/daniel-lang/tree/04-module-loader)
- [05 - Conditionals and iteration](https://github.com/jasonsbarr/daniel-lang/tree/05-if-for)
- [06 - Define, set, and let](https://github.com/jasonsbarr/daniel-lang/tree/06-define-let)
- 07 - Fun, fun, functions
- 08 - Lists and destructuring
- 09 - Making a CLI tool
- 10 - Modules and imports
- 11 - Adding keywords
- 12 - Maps and structs
- 13 - Classes and objects
- 14 - Quote, quasiquote, and unquote
- 15 - Syntactic extensions (macros)
- 16 - Exceptions and error handling
- 17 - Async

## Goals

Here are some features I have planned on the roadmap:

- A basic interpreter capable of executing the core language
- Collections and user-defined types
- Syntactic extensions (macros)
- A compiler with intermediate representation and at least some optimizations
- Tail call elimination
- A runtime based on an abstract machine
- Modules and imports
- A foreign function interface for creating modules in JavaScript
- A standard library, including IO functionalities and interaction with the operating system via Node.js
- Sample programs that go beyond toy examples to implement algorithms and applications
