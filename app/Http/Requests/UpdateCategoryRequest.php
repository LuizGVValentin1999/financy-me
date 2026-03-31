<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $houseId = $this->user()?->getCurrentHouse()?->id;

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('categories')
                    ->ignore($this->route('category')),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories')
                    ->where('house_id', $houseId)
                    ->ignore($this->route('category')),
            ],
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
