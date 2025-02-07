class Greeter {
    private greeting: string;

    constructor(greeting: string) {
        this.greeting = greeting;
    }

    public greet(name: string): string {
        return `${this.greeting}, ${name}!`;
    }
}

const greeter: Greeter = new Greeter("Hello");
const message: string = greeter.greet("World");

console.log(message);
