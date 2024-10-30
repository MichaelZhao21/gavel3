import { twMerge } from 'tailwind-merge';

const Loading = (props: { disabled: boolean }) => {
    return (
        <div
            className={twMerge(
                'fixed top-0 left-0 w-screen h-screen bg-[#00000077] justify-center items-center z-20',
                props.disabled ? 'hidden' : 'flex'
            )}
        >
            <div className="border-[16px] border-solid border-transparent border-t-primary rounded-full w-[10rem] h-[10rem] animate-spin z-30"></div>
        </div>
    );
};

export default Loading;
