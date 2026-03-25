import { Dropdown as AntDropdown } from 'antd';
import { InertiaLinkProps, Link } from '@inertiajs/react';
import {
    ReactElement,
    ReactNode,
    cloneElement,
    createContext,
    Dispatch,
    PropsWithChildren,
    isValidElement,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from 'react';

const DropDownContext = createContext<{
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    toggleOpen: () => void;
    content: ReactNode;
    setContent: Dispatch<SetStateAction<ReactNode>>;
    placement: 'bottomLeft' | 'bottomRight';
    setPlacement: Dispatch<SetStateAction<'bottomLeft' | 'bottomRight'>>;
    popupClassName: string;
    setPopupClassName: Dispatch<SetStateAction<string>>;
}>({
    open: false,
    setOpen: () => {},
    toggleOpen: () => {},
    content: null,
    setContent: () => {},
    placement: 'bottomRight',
    setPlacement: () => {},
    popupClassName: '',
    setPopupClassName: () => {},
});

const Dropdown = ({ children }: PropsWithChildren) => {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState<ReactNode>(null);
    const [placement, setPlacement] = useState<'bottomLeft' | 'bottomRight'>(
        'bottomRight',
    );
    const [popupClassName, setPopupClassName] = useState('');

    const toggleOpen = () => {
        setOpen((previousState) => !previousState);
    };

    return (
        <DropDownContext.Provider
            value={{
                open,
                setOpen,
                toggleOpen,
                content,
                setContent,
                placement,
                setPlacement,
                popupClassName,
                setPopupClassName,
            }}
        >
            <div className="relative">{children}</div>
        </DropDownContext.Provider>
    );
};

const Trigger = ({ children }: PropsWithChildren) => {
    const { open, setOpen, content, placement, popupClassName } =
        useContext(DropDownContext);

    if (!content) {
        return <>{children}</>;
    }

    if (!isValidElement(children)) {
        return (
            <AntDropdown
                open={open}
                onOpenChange={setOpen}
                trigger={['click']}
                placement={placement}
                dropdownRender={() => <div>{content}</div>}
                overlayClassName={popupClassName}
            >
                <span>{children}</span>
            </AntDropdown>
        );
    }

    return (
        <AntDropdown
            open={open}
            onOpenChange={setOpen}
            trigger={['click']}
            placement={placement}
            dropdownRender={() => <div>{content}</div>}
            overlayClassName={popupClassName}
        >
            {cloneElement(children as ReactElement)}
        </AntDropdown>
    );
};

const Content = ({
    align = 'right',
    width = '48',
    contentClasses = 'py-1 bg-white',
    children,
}: PropsWithChildren<{
    align?: 'left' | 'right';
    width?: '48';
    contentClasses?: string;
}>) => {
    const { setContent, setPlacement, setPopupClassName } =
        useContext(DropDownContext);

    useEffect(() => {
        setPlacement(align === 'left' ? 'bottomLeft' : 'bottomRight');
        setPopupClassName(width === '48' ? 'w-48' : '');
        setContent(
            <div
                className={`rounded-md border border-slate-200 bg-white shadow-lg ${contentClasses}`}
            >
                {children}
            </div>,
        );

        return () => {
            setContent(null);
            setPopupClassName('');
        };
    }, [
        align,
        children,
        contentClasses,
        setContent,
        setPlacement,
        setPopupClassName,
        width,
    ]);

    return null;
};

const DropdownLink = ({
    className = '',
    children,
    ...props
}: InertiaLinkProps) => {
    return (
        <Link
            {...props}
            className={
                'block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ' +
                className
            }
        >
            {children}
        </Link>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;
