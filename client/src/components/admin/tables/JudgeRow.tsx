import { useEffect, useRef, useState } from 'react';
import { errorAlert, timeSince } from '../../../util';
import DeletePopup from './DeletePopup';
import EditJudgePopup from './EditJudgePopup';
import { postRequest } from '../../../api';
import { useAdminStore, useOptionsStore } from '../../../store';
import { twMerge } from 'tailwind-merge';
import ConfirmPopup from '../../ConfirmPopup';
import RawTextInput from '../../RawTextInput';

interface JudgeRowProps {
    judge: Judge;
    idx: number;
    checked: boolean;
    handleCheckedChange: (e: React.ChangeEvent<HTMLInputElement>, idx: number) => void;
}

const JudgeRow = ({ judge, idx, checked, handleCheckedChange }: JudgeRowProps) => {
    const [popup, setPopup] = useState(false);
    const [editPopup, setEditPopup] = useState(false);
    const [movePopup, setMovePopup] = useState(false);
    const [newGroup, setNewGroup] = useState('');
    const [deletePopup, setDeletePopup] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const fetchJudges = useAdminStore((state) => state.fetchJudges);
    const options = useOptionsStore((state) => state.options);
    const selectedTrack = useOptionsStore((state) => state.selectedTrack);

    useEffect(() => {
        function closeClick(event: MouseEvent) {
            if (ref && ref.current && !ref.current.contains(event.target as Node)) {
                setPopup(false);
            }
        }

        // Bind the event listener
        document.addEventListener('mousedown', closeClick);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener('mousedown', closeClick);
        };
    }, [ref]);

    useEffect(() => {
        if (!judge) return;

        setNewGroup(String(judge.group));
    }, [judge]);

    const doAction = (action: 'edit' | 'prioritize' | 'move' | 'hide' | 'delete') => {
        switch (action) {
            case 'edit':
                // Open edit popup
                setEditPopup(true);
                break;
            case 'hide':
                // Hide
                hideJudge();
                break;
            case 'delete':
                // Open delete popup
                setDeletePopup(true);
                break;
            case 'move':
                setMovePopup(true);
                break;
            default:
                alert('Invalid action');
                break;
        }

        setPopup(false);
    };

    const hideJudge = async () => {
        const res = await postRequest<OkResponse>(
            judge.active ? '/judge/hide' : '/judge/unhide',
            'admin',
            { id: judge.id }
        );
        if (res.status === 200) {
            alert(`Judge ${judge.active ? 'hidden' : 'un-hidden'} successfully!`);
            fetchJudges();
        } else {
            errorAlert(res);
        }
    };

    const moveJudgeGroup = async () => {
        const res = await postRequest<OkResponse>('/judge/move', 'admin', {
            id: judge.id,
            group: Number(newGroup),
        });
        if (res.status === 200) {
            alert(`Judge moved successfully!`);
            fetchJudges();
            setMovePopup(false);
        } else {
            errorAlert(res);
        }
    };

    const getBestRanked = (judge: Judge) => {
        if (judge.rankings.length === 0) {
            return 'N/A';
        }

        const best = judge.rankings[0];
        const bestName = judge.seen_projects.find((p) => p.project_id === best)?.name;
        return bestName ? bestName : best;
    };

    return (
        <>
            <tr
                key={idx}
                className={twMerge(
                    'border-t-2 border-backgroundDark duration-150',
                    checked ? 'bg-primary/20' : !judge.active ? 'bg-lightest' : 'bg-background'
                )}
            >
                <td className="px-2">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                            handleCheckedChange(e, idx);
                        }}
                        className="cursor-pointer hover:text-primary duration-100"
                    ></input>
                </td>
                <td>{judge.name}</td>
                <td className="text-center">{judge.code}</td>
                {options.multi_group && selectedTrack === '' && (
                    <td className="text-center">{judge.group}</td>
                )}
                <td className="text-center">{judge.seen}</td>
                <td className="text-center">{getBestRanked(judge)}</td>
                <td className="text-center">{timeSince(judge.last_activity)}</td>
                <td className="text-right font-bold flex align-center justify-end">
                    {popup && (
                        <div
                            className="absolute flex flex-col bg-background rounded-md border-lightest border-2 font-normal text-sm"
                            ref={ref}
                        >
                            <div
                                className="py-1 pl-4 pr-2 cursor-pointer hover:bg-primary/20 duration-150"
                                onClick={() => doAction('edit')}
                            >
                                Edit
                            </div>
                            <div
                                className="py-1 pl-4 pr-2 cursor-pointer hover:bg-primary/20 duration-150"
                                onClick={() => doAction('hide')}
                            >
                                {judge.active ? 'Hide' : 'Un-hide'}
                            </div>
                            {options.multi_group && (
                                <div
                                    className="py-1 pl-4 pr-2 cursor-pointer hover:bg-primary/20 duration-150"
                                    onClick={() => doAction('move')}
                                >
                                    Move Group
                                </div>
                            )}
                            <div
                                className="py-1 pl-4 pr-2 cursor-pointer hover:bg-primary/20 duration-150 text-error"
                                onClick={() => doAction('delete')}
                            >
                                Delete
                            </div>
                        </div>
                    )}
                    <span
                        className="cursor-pointer px-1 hover:text-primary duration-150"
                        onClick={() => {
                            setPopup(!popup);
                        }}
                    >
                        ...
                    </span>
                </td>
            </tr>
            <ConfirmPopup
                enabled={movePopup}
                setEnabled={setMovePopup}
                onSubmit={moveJudgeGroup}
                submitText="Move"
                title="Move Judge"
            >
                <div className="flex flex-col items-center">
                    <p className="text-light">
                        Move the judge <span className="text-primary font-bold">{judge.name}</span>{' '}
                        to another group. Enter the new group number below.
                    </p>
                    <RawTextInput
                        name="group"
                        placeholder="New group"
                        text={newGroup}
                        setText={setNewGroup}
                        large
                        className="mt-2"
                    />
                </div>
            </ConfirmPopup>
            <DeletePopup enabled={deletePopup} setEnabled={setDeletePopup} element={judge} />
            <EditJudgePopup enabled={editPopup} setEnabled={setEditPopup} judge={judge} />
        </>
    );
};

export default JudgeRow;
