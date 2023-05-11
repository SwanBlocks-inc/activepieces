import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { Observable, Subject, catchError, map, of, switchMap, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  CollectionBuilderService,
  FlowsActionType,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { Flow } from '@activepieces/shared';
import { AnimationOptions } from 'ngx-lottie';
import { Actions, ofType } from '@ngrx/effects';
import { AuthenticationService } from '@activepieces/ui/common';
import { PromptsService } from './services/prompts.service';
import { AiGeneratedFlowFeedbackComponent } from './ai-generated-flow-feedback/ai-generated-flow-feedback.component';
import { ComponentPortal } from '@angular/cdk/portal';
@Component({
  selector: 'app-guess-flow',
  templateUrl: './guess-flow.component.html',
  styleUrls: ['./guess-flow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuessFlowComponent implements AfterViewInit {
  closeContainer = new Subject<boolean>();
  guessFlow$: Observable<Flow>;
  options: AnimationOptions = {
    path: '/assets/lottie/flow.json',
  };

  savePrompt$: Observable<unknown>;
  constructor(
    private store: Store,
    private actions: Actions,
    private authenticationService: AuthenticationService,
    private promptsService: PromptsService,
    private builderService: CollectionBuilderService
  ) {}
  ngAfterViewInit(): void {
    this.builderService.componentToShowInsidePortal$.next(
      new ComponentPortal(AiGeneratedFlowFeedbackComponent)
    );
  }
  guessFlow(prompt: string) {
    this.savePrompt$ = this.promptsService.savePrompt({
      prompt: prompt,
      userId: this.authenticationService.currentUser.id,
    });
    this.store.dispatch(FlowsActions.generateFlow({ prompt: prompt }));
    this.guessFlow$ = this.actions.pipe(
      ofType(FlowsActionType.GENERATE_FLOW_SUCCESSFUL),
      switchMap((res: Flow) => {
        return this.promptsService
          .savePromptAndResult({
            prompt,
            result: JSON.stringify(res),
            userId: this.authenticationService.currentUser.id,
          })
          .pipe(
            catchError(() => of(res)),
            map(() => res)
          );
      }),
      tap(() => {
        this.closeContainer.next(true);
      })
    );
  }
}
