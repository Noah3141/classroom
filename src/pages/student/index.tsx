import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React from "react";
import Card from "~/components/Card";
import CardPanel from "~/components/CardPanel";
import LoadingPage from "~/components/LoadingPage";
import { api } from "~/utils/api";

const StudentPage = () => {
    const session = useSession();
    const router = useRouter();

    const { data: submittedTests, isLoading: submittedTestsLoading } =
        api.student.getSubmittedTests.useQuery();
    const { data: classrooms, isLoading: classroomsLoading } =
        api.student.getClasses.useQuery();

    if (
        session.status == "loading" ||
        classroomsLoading ||
        submittedTestsLoading
    )
        return <LoadingPage />;

    if (session.status != "authenticated") {
        void signIn("email");
        return;
    }

    const Classrooms = classrooms ? (
        <div>
            <h2>Classes</h2>
            <div className="divide-y divide-stone-900">
                {classrooms.map((classroom) => {
                    return (
                        <div>
                            {classroom.title} - {classroom.season}{" "}
                            {classroom.schoolYear}
                        </div>
                    );
                })}
            </div>
        </div>
    ) : (
        "No classes"
    );

    const Submissions = submittedTests ? (
        <div>
            <h2>Submitted tests</h2>
            <div className="divide-y divide-stone-900">
                {submittedTests.map((submission) => {
                    return (
                        <div>
                            {submission.test.title} - {submission.score} (
                            {submission.class.title})
                        </div>
                    );
                })}
            </div>
        </div>
    ) : (
        "No tests submitted yet"
    );

    return (
        <CardPanel>
            <Card className="col-span-8 w-full">
                <div>{Classrooms}</div>
            </Card>
            <Card className="col-span-8 w-full">
                <div>{Submissions}</div>
            </Card>
        </CardPanel>
    );
};

export default StudentPage;
