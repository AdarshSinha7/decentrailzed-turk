// "use client"
// import { Appbar } from '@/components/Appbar';
// import { BACKEND_URL } from '@/utils';
// import axios from 'axios';
// import { useEffect, useState } from 'react';

// async function getTaskDetails(taskId: string) {
//     const response = await axios.get(`${BACKEND_URL}/v1/user/task?taskId=${taskId}`, {
//         headers: {
//             "Authorization": localStorage.getItem("token")
//         }
//     })
//     return response.data
// }

// export default function Page({params: { 
//     taskId 
// }}: {params: { taskId: string }}) {
//     const [result, setResult] = useState<Record<string, {
//         count: number;
//         option: {
//             imageUrl: string
//         }
//     }>>({});
//     const [taskDetails, setTaskDetails] = useState<{
//         title?: string
//     }>({});

//     useEffect(() => {
//         getTaskDetails(taskId)
//             .then((data) => {
//                 setResult(data.result)
//                 setTaskDetails(data.taskDetails)
//             })
//     }, [taskId]);

//     return <div>
//         <Appbar />
//         <div className='text-2xl pt-20 flex justify-center'>
//             {taskDetails.title}
//         </div>
//         <div className='flex justify-center pt-8'>
//             {Object.keys(result || {}).map(taskId => <Task imageUrl={result[taskId].option.imageUrl} votes={result[taskId].count} />)}
//         </div>
//     </div>
// }

// function Task({imageUrl, votes}: {
//     imageUrl: string;
//     votes: number;
// }) {
//     return <div>
//         <img className={"p-2 w-96 rounded-md"} src={imageUrl} />
//         <div className='flex justify-center'>
//             {votes}
//         </div>
//     </div>
// }

// "use client"

// import { Appbar } from '@/components/Appbar';
// import { BACKEND_URL } from '@/utils';
// import axios from 'axios';
// import { useEffect, useState } from 'react';

// export default function Page({ params: { taskId } }: { params: { taskId: string } }) {
//     const [result, setResult] = useState<Record<string, {
//         count: number;
//         option: {
//             imageUrl: string;
//         };
//     }>>({});

//     const [taskDetails, setTaskDetails] = useState<{ title?: string }>({});
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchTaskDetails = async () => {
//             try {
//                 const token = localStorage.getItem("token");
//                 if (!token) {
//                     console.error("Token not found");
//                     return;
//                 }

//                 const response = await axios.get(`${BACKEND_URL}/v1/user/task?taskId=${taskId}`, {
//                     headers: {
//                         "Authorization": token
//                     }
//                 });

//                 setResult(response.data.result || {});
//                 setTaskDetails(response.data.taskDetails || {});
//             } catch (err) {
//                 console.error("Failed to fetch task details", err);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchTaskDetails();
//     }, [taskId]);

//     return (
//         <div>
//             <Appbar />
//             <div className="text-2xl pt-20 flex justify-center">
//                 {loading ? "Loading..." : taskDetails?.title || "No Title Found"}
//             </div>
//             <div className="flex justify-center pt-8 gap-4 flex-wrap">
//                 {Object.keys(result || {}).map((key) => (
//                     <Task
//                         key={key}
//                         imageUrl={result[key]?.option?.imageUrl}
//                         votes={result[key]?.count}
//                     />
//                 ))}
//             </div>
//         </div>
//     );
// }

// function Task({ imageUrl, votes }: { imageUrl: string; votes: number }) {
//     return (
//         <div>
//             <img className="p-2 w-96 rounded-md" src={imageUrl} alt="Task option" />
//             <div className="flex justify-center">
//                 {votes}
//             </div>
//         </div>
//     );
// }
"use client"

import { Appbar } from '@/components/Appbar';
import { BACKEND_URL } from '@/utils';
import axios from 'axios';
import { use, useEffect, useState } from 'react';

// Since Next.js 14, `params` is a Promise. We'll unwrap it using `use()`.
export default function Page(props: { params: Promise<{ taskId: string }> }) {
    const { taskId } = use(props.params); // ✅ Unwrap with use()

    const [result, setResult] = useState<Record<string, {
        count: number;
        option: {
            imageUrl: string;
        };
    }>>({});

    const [taskDetails, setTaskDetails] = useState<{ title?: string }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTaskDetails = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("Token not found");
                    return;
                }

                const response = await axios.get(`${BACKEND_URL}/v1/user/task?taskId=${taskId}`, {
                    headers: {
                        "Authorization": token
                    }
                });

                setResult(response.data.result || {});
                setTaskDetails(response.data.taskDetails || {});
            } catch (err) {
                console.error("Failed to fetch task details", err);
                setError("Something went wrong while fetching the task.");
            } finally {
                setLoading(false);
            }
        };

        fetchTaskDetails();
    }, [taskId]);

    return (
        <div>
            <Appbar />
            <div className="text-2xl pt-20 flex justify-center">
                {loading ? "Loading..." : error ? error : taskDetails?.title || "No Title Found"}
            </div>
            <div className="flex justify-center pt-8 gap-4 flex-wrap">
                {Object.keys(result || {}).map((key) => (
                    <Task
                        key={key}
                        imageUrl={result[key]?.option?.imageUrl}
                        votes={result[key]?.count}
                    />
                ))}
            </div>
        </div>
    );
}

function Task({ imageUrl, votes }: { imageUrl: string; votes: number }) {
    return (
        <div>
            <img className="p-2 w-96 rounded-md" src={imageUrl} alt="Task option" />
            <div className="flex justify-center">
                {votes}
            </div>
        </div>
    );
}
