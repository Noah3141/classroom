import { ChoiceAnswer, ChoiceQuestion } from "@prisma/client";

type Opts = {
    choiceQuestions: ChoiceQuestion[];
    choiceAnswers: ChoiceAnswer[];
};

export type ChoiceWithStats = {
    text: string;
    frequencyChosen: number;
    value: number;
};

export type ChoiceQuestionWithStats = {
    choices: ChoiceWithStats[];
    id: string;
    prompt: string;
    testId: string;
    correctAnswer: number;
};

type Outs = ChoiceQuestionWithStats[];

export const addStatsToQuestions = (opts: Opts): Outs => {
    return opts.choiceQuestions.map((question) => {
        return {
            ...question,
            choices: question.choices.map((choice, choiceIndex) => {
                let frequencyChosen = 0;

                const thisQuestionsAnswers = opts.choiceAnswers.filter(
                    (answer) => answer.questionId == question.id,
                );

                thisQuestionsAnswers.forEach((answer) => {
                    if (answer.value == choiceIndex) {
                        frequencyChosen += 1;
                    }
                });

                frequencyChosen = frequencyChosen / thisQuestionsAnswers.length;

                return {
                    text: choice,
                    frequencyChosen,
                    value: choiceIndex,
                };
            }),
        };
    });
};
