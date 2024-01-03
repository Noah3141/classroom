import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import Card from "~/components/Card";
import CardPanel from "~/components/CardPanel";
import LoadingPage from "~/components/LoadingPage";
import { api } from "~/utils/api";

const StudentPage = () => {
    const session = useSession();
    const router = useRouter();

    const { data: classrooms, isLoading: classroomsLoading } =
        api.student.getClasses.useQuery();

    const [selectedClassroomId, selectClassroom] = useState<null | string>(
        null,
    );

    if (session.status == "loading" || classroomsLoading)
        return <LoadingPage />;

    if (session.status != "authenticated") {
        void signIn("email");
        return;
    }

    const Classrooms = classrooms ? (
        <div className="w-full">
            <h2 className="mb-3 flex flex-row justify-between">
                <span>Classes</span>
                {selectedClassroomId && (
                    <span
                        onClick={() => {
                            selectClassroom(null);
                        }}
                        className="click-span"
                    >
                        {"< All classes"}
                    </span>
                )}
            </h2>
            <div className="flex max-h-[45vh] w-full flex-col divide-y divide-stone-900 overflow-y-scroll">
                {classrooms.map((classroom) => {
                    const selected = selectedClassroomId == classroom.id;

                    return (
                        <div
                            onClick={() => {
                                selectClassroom(classroom.id);
                            }}
                            className={`flex w-full flex-row justify-between gap-3 rounded-md border-[1px] border-transparent p-2 hover:cursor-pointer hover:bg-stone-800 ${
                                selected ? " border-amber-600 bg-stone-950" : ""
                            }`}
                        >
                            <div>
                                {classroom.title} - {classroom.season}{" "}
                                {classroom.schoolYear}
                            </div>
                            <div className="shrink-0">
                                <div>Tests: {classroom._count.tests}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    ) : (
        "No classes"
    );

    return (
        <CardPanel>
            <Card className="col-span-4 w-full">
                <div className="w-full">{Classrooms}</div>
            </Card>
            <Card className="col-span-8 w-full">
                <div className="w-full">
                    <SubmissionList selectedClassroomId={selectedClassroomId} />
                </div>
            </Card>
        </CardPanel>
    );
};

export default StudentPage;

const SubmissionList = ({
    selectedClassroomId,
}: {
    selectedClassroomId: string | null;
}) => {
    const { data: submittedTests, isLoading: submittedTestsLoading } =
        api.student.getSubmittedTests.useQuery();

    if (submittedTestsLoading) {
        return "Loading...";
    }

    if (!submittedTests) {
        return "Submissions could not be found!";
    }

    const submissions = submittedTests
        .filter((classroom) => {
            if (selectedClassroomId) {
                return classroom.id == selectedClassroomId;
            } else {
                return true;
            }
        })
        .map((submission, i, list) => {
            return (
                <div>
                    {submission.test.title} - {submission.score} (
                    {submission.class.title})
                </div>
            );
        });

    if (!submissions.length) {
        return `No submissions yet${
            selectedClassroomId ? " for this class" : ""
        }.`;
    }

    return (
        <div>
            <div>
                <h2>Submitted tests</h2>
                <div className="divide-y divide-stone-900">{submissions}</div>
            </div>
        </div>
    );
};
