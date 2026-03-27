<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
        $product = $this->route('product');
        $productId = is_object($product) ? $product->id : $product;

        return [
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where(
                    'user_id',
                    $this->user()?->id,
                ),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products')
                    ->where('user_id', $this->user()?->id)
                    ->ignore($productId),
            ],
            'brand' => ['nullable', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:255'],
            'unit' => ['required', Rule::in(['un', 'kg', 'g', 'l', 'ml', 'cx'])],
            'minimum_stock' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
