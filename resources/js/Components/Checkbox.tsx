import { Checkbox as AntCheckbox } from 'antd';
import type { CheckboxProps } from 'antd';

export default function Checkbox({
    className = '',
    ...props
}: CheckboxProps) {
    return <AntCheckbox {...props} className={className} />;
}
