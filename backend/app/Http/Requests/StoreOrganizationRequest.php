<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

use Closure;

class StoreOrganizationRequest extends FormRequest
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
        return [
            'yandex_url' => ['required', 'string', 'max:2048', 'url', $this->checkWebUrl()],
        ];
    }

    private function checkWebUrl(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $host = parse_url($value, PHP_URL_HOST);
            $path = parse_url($value, PHP_URL_PATH);

            if (!is_string($host) || !str_contains($host, 'yandex.')) {
                $fail('Принимаются только ссылки Яндекс Карт.');
                return;
            }

            if (!is_string($path) || !str_contains($path, '/maps/')) {
                $fail('Введите ссылку на карточку организации в Яндекс Картах.');
                return;
            }

            if (!str_contains($path, '/org/')) {
                $fail('Ссылка должна вести на карточку организации.');
            }
        };
    }
}
