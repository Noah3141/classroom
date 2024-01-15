import { Class } from "@prisma/client";

class Classroom {
    class: Class;

    constructor(classroom: Class) {
        this.class = classroom;
    }

    name() {
        return `${this.class.title} - ${this.class.season} ${this.class.schoolYear}`;
    }
}
