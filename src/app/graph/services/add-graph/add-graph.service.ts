import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../api-config/api-url';
import { GetCategoriesResponse } from '../../model/Category';

@Injectable({
  providedIn: 'root',
})
export class AddGraphService {
  private readonly apiUrl = environment.apiUrl + '/api/File';

  constructor(private httpClient: HttpClient) {}

  uploadNode(file: File, header: string, category: string) {
    const formData: FormData = new FormData();

    formData.append('Header', header);
    formData.append('File', file);
    formData.append('CategoryId', category);
    formData.append('Name', 'name of file');

    return this.httpClient.post(this.apiUrl + '/upload-file-node', formData, {
      withCredentials: true,
    });
  }

  uploadEdge(file: File, from: string, to: string) {
    const formData = new FormData();

    formData.append('File', file);
    formData.append('From', from);
    formData.append('To', to);

    return this.httpClient.post(this.apiUrl + '/upload-file-edge', formData, {
      withCredentials: true,
    });
  }

  getCategories() {
    const pageSize = 999;
    const pageNumber = 0;
    return this.httpClient.get<GetCategoriesResponse>(
      environment.apiUrl +
        `/api/Categories?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      {
        withCredentials: true,
      }
    );
  }
}
