import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Button from "~/components/Button";
import Card from "~/components/Card";
import CardPanel from "~/components/CardPanel";
import LoadingPage from "~/components/LoadingPage";

import { api } from "~/utils/api";

export default function Home() {
    const session = useSession();
    const router = useRouter();

    if (session.status == "loading") return <LoadingPage />;

    if (session.status != "authenticated") {
        void signIn("email");
        return;
    }

    return (
        <>
            <Head>
                <title>ATAS</title>
                <meta name="description" content="Generated by create-t3-app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="mx-auto flex min-h-screen w-fit flex-col items-center justify-center gap-3 font-mono">
                {session.data.user.roles.some(
                    (role) => role == "Admin" || role == "Teacher",
                ) ? (
                    <TeachersWidget />
                ) : null}
                <Card>
                    <Link href={`/student`}>
                        <Button>Student Panel</Button>
                    </Link>
                </Card>
                <Card className="flex h-fit w-fit flex-col gap-3 rounded-lg bg-stone-900 p-10 shadow-lg">
                    {session.data.user.name}
                    <Button
                        className="whitespace-nowrap"
                        onClick={() => {
                            void signOut();
                        }}
                    >
                        Sign Out
                    </Button>
                </Card>

                <div></div>
            </div>
        </>
    );
}

const TeachersWidget = () => {
    return (
        <Card>
            <Button>
                <Link href={`teacher`}>Teacher Panel</Link>
            </Button>
        </Card>
    );
};
